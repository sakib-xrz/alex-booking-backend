"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.counselorFilterableFields = exports.counselorSearchableFields = void 0;
exports.counselorSearchableFields = ['name', 'email'];
exports.counselorFilterableFields = [
    'page',
    'limit',
    'sort_by',
    'sort_order',
    'search',
];
const CounselorConstants = {
    counselorSearchableFields: exports.counselorSearchableFields,
    counselorFilterableFields: exports.counselorFilterableFields,
};
exports.default = CounselorConstants;
