import { StatusCodes } from 'http-status-codes';
import { BenefitsModel } from '../models/Benefits.model.js';

export const upsertBenefits = async (req, res) => {
    try {
        const { empId, pfContribution, perks, month } = req.body; // optional month YYYY-MM
        if (!empId)
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'empId is required' });
        const update = {
            ...(pfContribution !== undefined
                ? { pfContribution: Number(pfContribution) || 0 }
                : {}),
            ...(Array.isArray(perks)
                ? {
                      perks: perks.map((p) => ({
                          label: p.label || 'Perk',
                          amount: Number(p.amount) || 0,
                      })),
                  }
                : {}),
        };
        const doc = await BenefitsModel.findOneAndUpdate({ empId }, update, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        if (month) {
            const idx = (doc.history || []).findIndex((h) => h.month === month);
            const entry = {
                month,
                pfContribution:
                    update.pfContribution !== undefined
                        ? update.pfContribution
                        : doc.pfContribution,
                perks: update.perks !== undefined ? update.perks : doc.perks,
            };
            if (idx >= 0) {
                doc.history[idx] = {
                    ...doc.history[idx],
                    ...entry,
                    savedAt: new Date(),
                };
            } else {
                doc.history.push({ ...entry, savedAt: new Date() });
            }
            await doc.save();
        }
        return res.status(StatusCodes.OK).json({ message: 'Saved', data: doc });
    } catch (err) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: err.message });
    }
};

export const getBenefits = async (req, res) => {
    try {
        const { empId } = req.params;
        const { month } = req.query; // optional
        const doc = await BenefitsModel.findOne({ empId });
        if (!doc) {
            return res.status(StatusCodes.OK).json({
                data: { empId, pfContribution: 0, perks: [], history: [] },
            });
        }
        if (month) {
            const entry = (doc.history || []).find((h) => h.month === month);
            if (entry) {
                return res.status(StatusCodes.OK).json({
                    data: {
                        empId,
                        pfContribution: entry.pfContribution,
                        perks: entry.perks,
                        month,
                    },
                });
            } else {
                // Explicitly return null for month not found
                return res.status(StatusCodes.OK).json({ data: null });
            }
        }
        return res.status(StatusCodes.OK).json({ data: doc });
    } catch (err) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: err.message });
    }
};

export const getBenefitsHistory = async (req, res) => {
    try {
        const { empId } = req.params;
        const doc = await BenefitsModel.findOne({ empId }).select(
            'history empId'
        );
        return res.status(StatusCodes.OK).json({ data: doc?.history || [] });
    } catch (err) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: err.message });
    }
};
