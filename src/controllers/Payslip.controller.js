import { StatusCodes } from 'http-status-codes';
import { renderPayslipPdf } from '../utils/pdf.js';
import EmpData from '../models/EmpDataModel.js';
import { EmployeeModel } from '../models/Employee.model.js';

export const downloadPayslip = async (req, res) => {
    try {
        const { id } = req.params; // EmpData _id
        const employee = await EmpData.findById(id).lean();
        if (!employee) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Employee not found' });
        }

        // Get PAN from verification details if exists
        let pancard = '-';
        if (employee.verificationDetails) {
            const ver = await EmployeeModel.findById(
                employee.verificationDetails
            ).lean();
            pancard = ver?.pancard || '-';
        }

        // Read optional attendance and calculated salary from query
        const presentDays = Number(req.query.presentDays ?? NaN);
        const absentDays = Number(req.query.absentDays ?? NaN);
        const calculatedSalary = Number(req.query.calculatedSalary ?? NaN);

        const baseAmount = Number.isFinite(calculatedSalary)
            ? calculatedSalary
            : employee.salary || 0;
        const amountInWords = numberToWordsInr(baseAmount);

        // Derive a simple breakdown to make the PDF richer (sums to baseAmount)
        const earningsBreakdown = [
            { label: 'Basic Pay', amount: Math.round(baseAmount * 0.5) },
            {
                label: 'House Rent Allowance',
                amount: Math.round(baseAmount * 0.3),
            },
            {
                label: 'Other Allowance',
                amount:
                    baseAmount -
                    Math.round(baseAmount * 0.5) -
                    Math.round(baseAmount * 0.3),
            },
        ];
        const generatedOn = new Date().toLocaleDateString('en-IN');

        const pdf = await renderPayslipPdf({
            employee,
            pancard,
            amountInWords,
            presentDays: Number.isFinite(presentDays) ? presentDays : undefined,
            absentDays: Number.isFinite(absentDays) ? absentDays : undefined,
            calculatedSalary: Number.isFinite(calculatedSalary)
                ? calculatedSalary
                : undefined,
            earningsBreakdown,
            generatedOn,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=payslip_${employee.empCode || id}.pdf`
        );
        return res.status(StatusCodes.OK).send(pdf);
    } catch (err) {
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: err.message });
    }
};

// Converts numbers to Indian currency words (basic implementation)
function numberToWordsInr(amount) {
    const ones = [
        '',
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'eleven',
        'twelve',
        'thirteen',
        'fourteen',
        'fifteen',
        'sixteen',
        'seventeen',
        'eighteen',
        'nineteen',
    ];
    const tens = [
        '',
        '',
        'twenty',
        'thirty',
        'forty',
        'fifty',
        'sixty',
        'seventy',
        'eighty',
        'ninety',
    ];
    function numToWords(n) {
        if (n < 20) return ones[n];
        if (n < 100)
            return (
                tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
            );
        if (n < 1000)
            return (
                ones[Math.floor(n / 100)] +
                ' hundred' +
                (n % 100 ? ' ' + numToWords(n % 100) : '')
            );
        return '';
    }
    if (amount === 0) return 'zero rupees';
    const crore = Math.floor(amount / 10000000);
    amount %= 10000000;
    const lakh = Math.floor(amount / 100000);
    amount %= 100000;
    const thousand = Math.floor(amount / 1000);
    amount %= 1000;
    const hundred = Math.floor(amount / 100);
    const rest = amount % 100;

    let words = '';
    if (crore) words += numToWords(crore) + ' crore ';
    if (lakh) words += numToWords(lakh) + ' lakh ';
    if (thousand) words += numToWords(thousand) + ' thousand ';
    if (hundred) words += ones[hundred] + ' hundred ';
    if (rest) words += numToWords(rest) + ' ';
    return (words + 'rupees').replace(/\s+/g, ' ').trim();
}
