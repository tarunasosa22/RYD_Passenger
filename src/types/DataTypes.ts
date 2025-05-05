export interface GeocoderResponseTypes {
    adminArea: "GJ"
    country: "India"
    countryCode: "IN"
    feature: "1, SH 167"
    formattedAddress: "Dwarkesh Society, 1, SH 167, Mota Varachha, Surat, 394101, Gujarat, India"
    locality: "Surat"
    position: {
        lat: 21.242188998723282
        lng: 72.88762181997299
    }
    postalCode: "394101"
    streetName: "SH 167"
    streetNumber: "1"
    subAdminArea: "Surat"
    subLocality: "Mota Varachha"
};

export interface ImageProps {
    uri?: string,
    name?: string,
    type?: string
};

export enum stateType {
    active = 'active',
    background = 'background',
    extension = 'extension',
    inactive = 'inactive',
    unknown = 'unknown',
};

export interface UserDocumentTypes {
    profilePicture: string,
    bankAccountImage: string,
    aadharCard: string,
    panCard: string,
    passport: string
};
