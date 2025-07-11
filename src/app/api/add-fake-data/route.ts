import messages from "@apiUtils/messages";
import { createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

export const POST = authMiddleware(
  async (request: NextRequest, response: NextResponse, user: User) => {
    try {
      // Add 5 fake brands
      const brandNames = [
        {
          name: "Apple",
          logo: "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8ed3d547-94ff-48e1-9f20-8c14a7030a02_2000x2000.jpeg",
          totalAds: 200,
        },
        {
          name: "Samsung",
          logo: "https://1000logos.net/wp-content/uploads/2017/06/Samsung-logo.jpg",
          totalAds: 245,
        },
        {
          name: "Google",
          logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiVCyndYx93Mjp1YYBMllyRlvVy4POUBGTDg&s",
          totalAds: 1432,
        },
        {
          name: "Microsoft",
          logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png",
          totalAds: 1000,
        },
        {
          name: "Amazon",
          logo: "https://cdn0.iconfinder.com/data/icons/most-usable-logos/120/Amazon-512.png",
          totalAds: 50,
        },
      ];

      await Promise.all(
        brandNames.map((brand) =>
          prisma.brand.create({
            data: {
              name: brand.name,
              logo: brand.logo,
              totalAds: brand.totalAds,
            },
          })
        )
      );

      return createResponse({
        message: messages.SUCCESS,
        payload: {
          message: "5 fake brands added successfully",
        },
      });
    } catch (error) {
      console.error("Error adding fake data:", error);
      return createResponse({
        message: messages.ERROR,
        payload: {
          message: "Failed to add fake brands",
        },
        status: 500,
      });
    }
  }
);
