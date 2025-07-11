import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import statuscodes from "@apiUtils/statuscodes";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest } from "next/server";
import validation from "./validation";

export const dynamic = "force-dynamic";

export const GET = authMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { folderId: string } },
    user: User
  ) => {
    const folder = await prisma.folder.findFirst({
      where: {
        id: params.folderId,
        userId: user.id,
      },
    });

    if (!folder) {
      return createError({
        message: messages.NOT_FOUND,
      });
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: { folder },
    });
  }
);

export const DELETE = authMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { folderId: string } },
    user: User
  ) => {
    await prisma.folder.delete({
      where: {
        id: params.folderId,
        userId: user.id,
      },
    });

    return createResponse({
      message: messages.SUCCESS,
      payload: {},
    });
  }
);

export const PATCH = authMiddleware(
  async (
    request: NextRequest,
    { params }: { params: { folderId: string } },
    user: User
  ) => {
    const { error, value } = validation.patch.validate(await request.json());
    if (error) {
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
      });
    }

    let { name } = value;

    const folder = await prisma.folder.findFirst({
      where: {
        id: params.folderId,
      },
    });

    if (!folder) {
      return createError({
        message: messages.NOT_FOUND,
        status: statuscodes.NOT_FOUND,
      });
    }

    let updatedFolder = folder;
    if (name && name !== "") {
      updatedFolder = await prisma.folder.update({
        where: {
          id: params.folderId,
        },
        data: {
          name,
        },
      });
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        folder: updatedFolder,
      },
    });
  }
);
