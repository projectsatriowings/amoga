-- Safe Additive Migration: Add Stall Staff Roles and Location Permissions
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'STALL_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'STALL_CASHIER';

ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "assignedLocationIds" JSONB;
