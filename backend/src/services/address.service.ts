/**
 * Address business logic. Setting an address as default demotes the previous
 * default for that user (single default invariant).
 */
import { Address, IAddress, User } from '../models';
import { ApiError } from '../utils/ApiError';

export async function listAddresses(userId: string): Promise<IAddress[]> {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
}

export async function getAddress(userId: string, id: string): Promise<IAddress> {
  const address = await Address.findOne({ _id: id, user: userId });
  if (!address) throw ApiError.notFound('Address');
  return address;
}

export async function createAddress(userId: string, input: Partial<IAddress>): Promise<IAddress> {
  if (input.isDefault) await unsetDefault(userId);
  const address = await Address.create({ ...input, user: userId });
  await User.findByIdAndUpdate(userId, { $push: { addresses: address._id } });
  return address;
}

export async function updateAddress(userId: string, id: string, input: Partial<IAddress>): Promise<IAddress> {
  if (input.isDefault) await unsetDefault(userId);
  const address = await Address.findOneAndUpdate({ _id: id, user: userId }, input, { new: true, runValidators: true });
  if (!address) throw ApiError.notFound('Address');
  return address;
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const address = await Address.findOneAndDelete({ _id: id, user: userId });
  if (!address) throw ApiError.notFound('Address');
  await User.findByIdAndUpdate(userId, { $pull: { addresses: address._id } });
}

export async function setDefault(userId: string, id: string): Promise<IAddress> {
  const address = await getAddress(userId, id);
  await unsetDefault(userId);
  address.isDefault = true;
  await address.save();
  return address;
}

async function unsetDefault(userId: string): Promise<void> {
  await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
}