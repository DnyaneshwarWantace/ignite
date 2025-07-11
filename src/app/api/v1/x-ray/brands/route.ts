import { convertURLSearchParamsToObject } from "@apiUtils/helpers";
import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest, NextResponse } from "next/server";
import validation from "./validation";

export const dynamic = "force-dynamic";

export const GET = authMiddleware(
  async (request: NextRequest, response: NextResponse, user: User) => {
    // Validate
    const searchParams = request.nextUrl.searchParams;
    const { error, value } = validation.get.validate(
      convertURLSearchParamsToObject(searchParams)
    );
    if (error) {
      return createError({
        message: messages.VALIDATION_ERROR,
        payload: error.details,
      });
    }
    const { search } = value;

    // Fetch brands
    let query: any = {};

    if (search && search !== "") {
      query = {
        ...query,
        name: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    const allBrands = await prisma.brand.findMany({
      where: query,
    });

    return createResponse({
      message: messages.SUCCESS,
      payload: { brands: allBrands },
    });
  }
);
