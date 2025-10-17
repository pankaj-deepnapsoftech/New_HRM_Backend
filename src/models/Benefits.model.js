import { Schema, model } from 'mongoose';

const BenefitsSchema = new Schema(
    {
        empId: {
            type: Schema.Types.ObjectId,
            ref: 'EmpData',
            required: true,
            unique: true,
        },
        pfContribution: { type: Number, default: 0 },
        perks: [
            { label: { type: String }, amount: { type: Number, default: 0 } },
        ],
        history: [
            {
                month: { type: String }, // e.g. 2025-01
                pfContribution: { type: Number, default: 0 },
                perks: [
                    {
                        label: { type: String },
                        amount: { type: Number, default: 0 },
                    },
                ],
                savedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export const BenefitsModel = model('Benefits', BenefitsSchema);
