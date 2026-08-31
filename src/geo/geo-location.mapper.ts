import { GeoLocationDto } from './dto/geo-location.dto';
import { AxiosResponse } from 'axios';

export interface IpapiResponse {
  country_code: string;
  city: string;
  error?: boolean;
  reason?: string;
}

export function geoMapper(
  response: AxiosResponse<IpapiResponse>,
): GeoLocationDto {
  return {
    countryCode: response.data.country_code,
    city: response.data.city,
  };
}
