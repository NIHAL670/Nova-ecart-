import { get, post, patch, del } from '@/lib/api';
import { api } from '@/constants';
import type { Address } from '@/types';

export type AddressInput = Omit<Address, '_id'> & { isDefault?: boolean };

export async function fetchAddresses(): Promise<Address[]> {
  return get<Address[]>(api.addresses.list);
}

export async function createAddress(input: AddressInput): Promise<Address> {
  return post<Address>(api.addresses.create, input);
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  return patch<Address>(api.addresses.update(id), input);
}

export async function deleteAddress(id: string): Promise<null> {
  return del<null>(api.addresses.remove(id));
}

export async function setDefaultAddress(id: string): Promise<Address> {
  return post<Address>(api.addresses.setDefault(id));
}