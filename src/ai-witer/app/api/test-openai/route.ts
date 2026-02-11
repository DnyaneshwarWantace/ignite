import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "OPENAI_API_KEY not found in environment variables",
        message: "Please add OPENAI_API_KEY to your .env.local file"
      });
    }

    // Test with a simple API call to check account status
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: "Invalid API Key",
          message: "Your OpenAI API key is invalid or expired. Please check your API key at https://platform.openai.com/api-keys",
          status: response.status,
          details: errorData
        });
      }
      
      if (response.status === 429) {
        if (errorData.error?.code === 'insufficient_quota') {
          return NextResponse.json({
            success: false,
            error: "Insufficient Quota",
            message: "You have exceeded your OpenAI quota. Please check your billing at https://platform.openai.com/account/billing",
            status: response.status,
            details: errorData
          });
        } else {
          return NextResponse.json({
            success: false,
            error: "Rate Limit",
            message: "Too many requests. Please wait a moment.",
            status: response.status,
            details: errorData
          });
        }
      }

      return NextResponse.json({
        success: false,
        error: `API Error: ${response.status}`,
        message: errorData.error?.message || "Unknown error",
        status: response.status,
        details: errorData
      });
    }

    // Try a simple chat completion to test quota
    const testResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Say 'API test successful' if you can read this."
          }
        ],
        max_tokens: 10,
      }),
    });

    if (!testResponse.ok) {
      const testErrorData = await testResponse.json().catch(() => ({}));
      
      if (testResponse.status === 429 && testErrorData.error?.code === 'insufficient_quota') {
        return NextResponse.json({
          success: false,
          error: "Insufficient Quota",
          message: "Your OpenAI account has insufficient quota/credits. Please add billing information at https://platform.openai.com/account/billing",
          status: testResponse.status,
          details: testErrorData,
          apiKeyValid: true,
          canListModels: true
        });
      }

      return NextResponse.json({
        success: false,
        error: `Test failed: ${testResponse.status}`,
        message: testErrorData.error?.message || "Could not complete test request",
        status: testResponse.status,
        details: testErrorData,
        apiKeyValid: true,
        canListModels: true
      });
    }

    const testData = await testResponse.json();
    const tokensUsed = testData.usage?.total_tokens || 0;

    return NextResponse.json({
      success: true,
      message: "OpenAI API is working correctly!",
      apiKeyValid: true,
      canListModels: true,
      canMakeRequests: true,
      testResponse: testData.choices[0]?.message?.content || "No response",
      tokensUsed: tokensUsed,
      model: testData.model,
      note: "Your API key is valid and you have quota available. You can use the platform normally."
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Test failed",
      message: error.message || "Unknown error occurred",
      details: error.toString()
    });
  }
}
