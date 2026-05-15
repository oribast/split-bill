import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100, 'Максимум 100 символов'),
  password: z.string().max(100, 'Максимум 100 символов').optional(),
  currency: z.string().length(3).default('RUB'),
});

export const addParticipantSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100, 'Максимум 100 символов'),
});

export const sharedExpenseSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  amount: z.coerce.number().min(0.01, 'Сумма должна быть больше 0'),
  payerId: z.string().min(1, 'Выберите кто платил'),
  participantIds: z.array(z.string()).min(1, 'Выберите хотя бы одного участника'),
});

export const individualExpenseSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  amount: z.coerce.number().min(0.01, 'Сумма должна быть больше 0'),
  payerId: z.string().min(1, 'Выберите кто платил'),
  participantIds: z.array(z.string()).min(1, 'Выберите хотя бы одного участника'),
});
