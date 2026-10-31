
export interface CurrentUserProps {
    UserID: string,
    Fullname: string,
    Email: string,
    PhoneNo: string | null,
    Role: string,
    Category: string | null,
    IsActive: boolean,
    CreatedAt: string,
    UpdatedAt: string,
    company: {
        CompanyID: string | null,
        CompanyName: string | null,
    } | null,
    zone: {
        ZoneID: string | null,
        ZoneCode: string | null,
        ZoneName: string | null,
        IsActive: boolean,
        CampusCode: string | null
    } | null,
    campus: {
        CampusCode: string | null,
        CampusName: string | null,
        State: string | null,
    } | null,
}