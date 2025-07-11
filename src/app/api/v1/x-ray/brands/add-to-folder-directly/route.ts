import { convertURLSearchParamsToObject } from "@apiUtils/helpers";
import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest, NextResponse } from "next/server";
import validation from "./validation";

export const dynamic = "force-dynamic";

export const POST = authMiddleware(
  async (request: NextRequest, response: NextResponse, user: User) => {
    const { error, value } = validation.post.validate(await request.json());
    if (error) {
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
      });
    }

    let { folderId, brandIds } = value;
    let targetFolder = null;

    // Handle default folder when folder id is 0
    if (folderId === "0") {
      // First, try to find an existing "Default" folder for this user
      targetFolder = await prisma.folder.findFirst({
        where: {
          name: "Default",
          userId: user.id,
        },
      });

      // If no default folder exists, create one
      if (!targetFolder) {
        targetFolder = await prisma.folder.create({
          data: {
            name: "Default",
            userId: user.id,
          },
        });
        console.log("Created new Default folder for user:", user.id);
      } else {
        console.log("Using existing Default folder:", targetFolder.id);
      }
    }

    // Fetch folder
    if (folderId !== "0") {
      targetFolder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: user.id,
        },
      });

      if (!targetFolder) {
        return createError({
          message: messages.FOLDER_NOT_FOUND,
        });
      }
    }

    // Fetch brands
    const targetBrands = await prisma.brand.findMany({
      where: {
        id: {
          in: brandIds,
        },
      },
    });

    // Add brand to folder
    targetBrands.forEach(async (brand) => {
      // Check if brand already exists in folder
      const existingFolderBrand = await prisma.folder.findFirst({
        where: {
          id: targetFolder?.id,
          brands: {
            some: {
              id: brand.id,
            },
          },
        },
        include: {
          brands: true,
        },
      });

      if (!existingFolderBrand) {
        await prisma.folder.update({
          where: {
            id: targetFolder?.id,
          },
          data: {
            brands: {
              connect: {
                id: brand.id,
              },
            },
          },
        });
      }
    });

    return createResponse({
      message: messages.SUCCESS,
      payload: {
        folder: targetFolder,
        brands: targetBrands,
      },
    });
  }
);
