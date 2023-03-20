"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardError = exports.AccessRightsFields = exports.Events = void 0;
var Events;
(function (Events) {
    Events["error"] = "onError";
    Events["message"] = "onMessage";
    Events["sdkInitialized"] = "onSdkInit";
    Events["sdkDisconnected"] = "onSdkDisconnect";
    Events["commandSentSuccessfully"] = "onCommandSentSuccessfully";
})(Events = exports.Events || (exports.Events = {}));
var AccessRightsFields;
(function (AccessRightsFields) {
    AccessRightsFields["Address"] = "Address";
    AccessRightsFields["BirthName"] = "BirthName";
    AccessRightsFields["FamilyName"] = "FamilyName";
    AccessRightsFields["GivenNames"] = " GivenNames";
    AccessRightsFields["PlaceOfBirth"] = "PlaceOfBirth";
    AccessRightsFields["DateOfBirth"] = "DateOfBirth";
    AccessRightsFields["DoctoralDegree"] = "DoctoralDegree";
    AccessRightsFields["ArtisticName"] = "ArtisticName";
    AccessRightsFields["Pseudonym"] = "Pseudonym";
    AccessRightsFields["ValidUntil"] = "ValidUntil";
    AccessRightsFields["Nationality"] = "Nationality";
    AccessRightsFields["IssuingCountry"] = "IssuingCountry";
    AccessRightsFields["DocumentType"] = "DocumentType";
    AccessRightsFields["ResidencePermitI"] = "ResidencePermitI";
    AccessRightsFields["ResidencePermitII"] = "ResidencePermitII";
    AccessRightsFields["CommunityID"] = "CommunityID";
    AccessRightsFields["AddressVerification"] = "AddressVerification";
    AccessRightsFields["AgeVerification"] = "AgeVerification";
    AccessRightsFields["WriteAddress"] = "WriteAddress";
    AccessRightsFields["WriteCommunityID"] = "WriteCommunityID";
    AccessRightsFields["WriteResidencePermitI"] = "WriteResidencePermitI";
    AccessRightsFields["WriteResidencePermitII"] = "WriteResidencePermitII";
    AccessRightsFields["CanAllowed"] = "CanAllowed";
    AccessRightsFields["PinManagement"] = "PinManagement";
})(AccessRightsFields = exports.AccessRightsFields || (exports.AccessRightsFields = {}));
var CardError;
(function (CardError) {
    CardError["cardIsBlocked"] = "cardIsBlocked";
})(CardError = exports.CardError || (exports.CardError = {}));
//# sourceMappingURL=types.js.map