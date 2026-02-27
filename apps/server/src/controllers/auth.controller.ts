import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "@repo/database";
import { generateToken } from "../utils/jwt";

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      balance: {
        create: {
          amount: 10000,
        },
      },
    },
  });

  const token = generateToken(user.id);

  res.status(201).json({ token });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ message: "Invalid Password" });
  }

  const token = generateToken(user.id);

  res.status(201).json({ token });
};
