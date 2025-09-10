"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientFilterableFields = exports.clientSearchableFields = void 0;
exports.clientSearchableFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
];
exports.clientFilterableFields = [
    'gender',
    'page',
    'limit',
    'sort_by',
    'sort_order',
    'search',
];
const ClientConstants = {
    clientSearchableFields: exports.clientSearchableFields,
    clientFilterableFields: exports.clientFilterableFields,
};
exports.default = ClientConstants;
