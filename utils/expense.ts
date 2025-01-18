import prisma from '@prisma/prisma';
import { ExpenseType } from './types';

const createOrGetCategory = async (name: string) => {
  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name }
  });
  return category;
};

export const createExpense = async (data: ExpenseType) => {
  const category = await createOrGetCategory(data.categoryName);

  const newExpense = await prisma.expense.create({
    data: {
      description: data.description,
      cost: data.cost,
      categoryId: category.id,
      deleted: false
    },
    include: {
      category: true
    }
  });

  return newExpense;
};

export const updateExpense = async (id: string, data: Partial<ExpenseType>) => {
  let categoryId = undefined;

  if (data.categoryName) {
    const category = await createOrGetCategory(data.categoryName);
    categoryId = category.id;
  }

  const updatedExpense = await prisma.expense.update({
    where: {
      id,
      deleted: false
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.cost && { cost: data.cost }),
      ...(categoryId && { categoryId })
    },
    include: {
      category: true
    }
  });

  return updatedExpense;
};

export const deleteExpense = async (id: string) => {
  await prisma.expense.update({
    where: {
      id,
      deleted: false
    },
    data: {
      deleted: true
    }
  });
};
