import mongoose from "mongoose";
import LeaveRequest from "../models/leaveRequestModel.js";
import Leave from "../models/leaveModel.js";

/**
 * Helper: normalize date to midnight (local)
 */
const normalize = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Apply the leave (split across months) into final Leave collection.
 * If session provided, operations run inside transaction.
 */
export const applyLeaveToFinal = async (requestDoc, session = null) => {
  const { employeeId, from, to, type, mode, description, file } = requestDoc;
  let current = normalize(new Date(from));
  const toDate = normalize(new Date(to));
  const msPerDay = 24 * 60 * 60 * 1000;

  while (current <= toDate) {
    const month = current.getMonth() + 1;
    const year = current.getFullYear();

    const monthEnd = new Date(year, month, 0); // last day of month
    const lastDayThisMonth = toDate < monthEnd ? toDate : monthEnd;

    const daysThisMonth = Math.floor((lastDayThisMonth - current) / msPerDay) + 1;

    // rule: mode 'half' => each day counts 0.5 (so multi-day half => 0.5 * days)
    const effectiveDays = mode === "half" ? daysThisMonth * 0.5 : daysThisMonth;

    // Prepare update: atomic increment + push entry for auditing
    await Leave.findOneAndUpdate(
      { employeeId, month, year },
      {
        $inc: { [type]: effectiveDays },
        $push: {
          leaves: {
            from: current,
            to: lastDayThisMonth,
            type,
            mode,
            description,
            file,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, session }
    );

    // next month
    current = new Date(year, month, 1); // 1st of next month
  }
};

/**
 * Employee posts new leave request (pending).
 * Use multer in route to handle req.file
 */
export const requestLeave = async (req, res) => {
  try {
    const { employeeId, from, to, type, mode, description } = req.body;
    const file = req.file ? `/uploads/${req.file.filename}` : null;

    if (!employeeId || !from || !to || !type) {
      return res.status(400).json({ success: false, message: "employeeId, from, to and type required" });
    }

    const newRequest = await LeaveRequest.create({
      employeeId,
      from,
      to,
      type,
      mode,
      description,
      file,
    });

    return res.json({ success: true, message: "Request submitted", data: newRequest });
  } catch (err) {
    // console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * HR updates status (approve/reject). If approved -> apply to final Leave collection.
 * This uses a mongoose transaction for safety.
 */
export const updateLeaveStatus = async (req, res) => {
  const { requestId } = req.params;
  const { status, hrRemark, approverId } = req.body; // approverId = HR user id
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const request = await LeaveRequest.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    request.status = status;
    if (hrRemark) request.hrRemark = hrRemark;
    if (approverId) request.approvedBy = approverId;
    await request.save({ session });

    if (status === "approved") {
      // apply to final Leave collection
      await applyLeaveToFinal(request, session);
    }

    await session.commitTransaction();
    session.endSession();
    return res.json({ success: true, message: `Leave ${status}`, data: request });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    // console.error("updateLeaveStatus error:", err);
    // console.log
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * List pending requests (for HR dashboard)
 */
export const getPendingRequests = async (req, res) => {
  try {
    const pending = await LeaveRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.json({ success: true, data: pending });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get employee leaves for a year (final aggregated docs)
 */
export const getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId, year } = req.params;
    const docs = await Leave.find({ employeeId, year: Number(year) }).sort({ month: 1 });
    return res.json({ success: true, data: docs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
