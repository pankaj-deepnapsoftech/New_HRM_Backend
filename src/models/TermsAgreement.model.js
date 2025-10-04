import mongoose from "mongoose";

const TermsAgreementSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const TermsAgreement =
  mongoose.models.TermsAgreement ||
  mongoose.model("TermsAgreement", TermsAgreementSchema);


