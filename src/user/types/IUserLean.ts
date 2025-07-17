import { Types } from 'mongoose';

export interface IUserLean {
  _id: Types.ObjectId;
  email: string;
  name: string;
  isVerified: boolean;
  updatedAt: Date;
  deletedAt: Date | null;
}
