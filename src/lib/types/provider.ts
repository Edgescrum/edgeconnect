export interface ProviderBase {
  slug: string;
  name: string;
  icon_url: string | null;
}

export interface ProviderProfile extends ProviderBase {
  id: number;
  bio: string | null;
  line_contact_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  brand_color: string | null;
  category: string | null;
}
