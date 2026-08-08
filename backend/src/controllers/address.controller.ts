/**
 * Address handlers (all protected).
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import * as service from '../services/address.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.listAddresses(req.user!.id), 'Addresses fetched'));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await service.getAddress(req.user!.id, req.params.id), 'Address fetched'));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const address = await service.createAddress(req.user!.id, req.body);
  res.status(201).json(ok(address, 'Address added'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const address = await service.updateAddress(req.user!.id, req.params.id, req.body);
  res.json(ok(address, 'Address updated'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteAddress(req.user!.id, req.params.id);
  res.json(ok(null, 'Address deleted'));
});

export const setDefault = asyncHandler(async (req: Request, res: Response) => {
  const address = await service.setDefault(req.user!.id, req.params.id);
  res.json(ok(address, 'Default address set'));
});