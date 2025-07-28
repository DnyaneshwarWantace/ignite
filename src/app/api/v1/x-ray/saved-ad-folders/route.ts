import { NextRequest, NextResponse } from "next/server";
import { User } from "@prisma/client";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

// GET - Fetch saved ad folders
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const search = searchParams.get('search') || '';

      let whereClause: any = {
        userId: user.id
      };

      if (search && search !== "") {
        whereClause.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      const folders = await prisma.savedAdFolder.findMany({
        where: whereClause,
        include: {
          savedAds: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          folders: folders
        }
      });

    } catch (error) {
      console.error('Error fetching saved ad folders:', error);
      return createError({
        message: "Failed to fetch saved ad folders",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// POST - Create a new saved ad folder
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      let body;
      try {
        body = await request.json();
        console.log('Creating folder with body:', body);
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return createError({
          message: "Invalid request body",
          status: 400
        });
      }
      
      const { name } = body;

      if (!name || name.trim() === '') {
        console.log('Folder name validation failed:', { name, body });
        return createError({
          message: "Folder name is required",
          status: 400
        });
      }

      // Check if folder with same name already exists for this user
      const existingFolder = await prisma.savedAdFolder.findFirst({
        where: {
          name: name.trim(),
          userId: user.id
        }
      });

      if (existingFolder) {
        console.log('Folder already exists:', { name: name.trim(), userId: user.id });
        return createError({
          message: "A folder with this name already exists",
          status: 400
        });
      }

      const folder = await prisma.savedAdFolder.create({
        data: {
          name: name.trim(),
          userId: user.id
        }
      });

      console.log('Folder created successfully:', folder);

      return createResponse({
        message: "success",
        payload: {
          folder: folder
        }
      });

    } catch (error) {
      console.error('Error creating saved ad folder:', error);
      return createError({
        message: "Failed to create folder",
        payload: { error: (error as Error).message }
      });
    }
  }
); 