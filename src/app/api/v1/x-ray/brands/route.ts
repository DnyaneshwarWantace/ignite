import { convertURLSearchParamsToObject } from "@apiUtils/helpers";
import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import validation from "./validation";

// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

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
    let supabaseQuery = supabase
      .from('brands')
      .select('*');

    if (search && search !== "") {
      supabaseQuery = supabaseQuery.ilike('name', `%${search}%`);
    }

    const { data: allBrands, error: fetchError } = await supabaseQuery;

    if (fetchError) {
      console.error("Error fetching brands:", fetchError);
      return createError({
        message: "Failed to fetch brands",
        payload: fetchError.message,
      });
    }

    return createResponse({
      message: messages.SUCCESS,
      payload: { brands: allBrands || [] },
    });
  }
);
