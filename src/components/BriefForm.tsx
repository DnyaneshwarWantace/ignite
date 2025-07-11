"use client";
import React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BriefSchema } from "@/lib/schemas";
import { InputWithIcon } from "./ui/input-with-icon";
import { Separator } from "./ui/separator";

export default function BriefForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const form = useForm<z.infer<typeof BriefSchema>>({
    resolver: zodResolver(BriefSchema),
    defaultValues: {
      url: "",
      briefName: "",
      brandName: "",
      productName: "",
      adObjective: "",
      productDescription: "",
      usp: "",
      targetAudience: "",
      toneOfVoice: "",
    },
  });

  function onSubmit(values: z.infer<typeof BriefSchema>) {
    console.log(values);
    // Handle form submission
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-scroll">
        <div className="space-y-4 bg-primary/10 p-4">
          <div>
            <h2 className="text-sm font-medium">Landing Page Analyzer</h2>
            <p className="text-sm text-muted-foreground">Analyze your landing page or website to generate the fields below</p>
          </div>
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <InputWithIcon icon={<Link className="h-4 w-4" />} iconPosition="left" placeholder="Add URL" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="button" variant={"default"} onClick={() => setIsGenerating(true)} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
        <div className="px-4 space-y-4">
          <div className="space-y-4">
            <h2 className="text-sm font-medium border-b pb-2">Or, fill in the fields below manually</h2>
            <FormField
              control={form.control}
              name="briefName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief Name *</FormLabel>
                  <FormControl>
                    <Input className="text-md" placeholder="Brief Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name *</FormLabel>
                  <FormControl>
                    <Input className="text-md" placeholder="Brand Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service Name *</FormLabel>
                  <FormControl>
                    <Input className="text-md" placeholder="Product/Service Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adObjective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Objective *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-md">
                        <SelectValue placeholder="Select Ad Objective" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="consideration">Consideration</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service description *</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Features, benefits, etc in under 500 words..." className="text-md" {...field} />
                  </FormControl>
                  <FormDescription className="text-sm">Brief explanation = better results</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unique Selling Proposition (USP)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="In under 500 words describe what makes your product/service unique or superior to competitors?"
                      className="resize-none text-md"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-sm">Brief explanation = better results</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Example: Corporate employees between the age 24-30" className="text-md" {...field} />
                  </FormControl>
                  <FormDescription className="text-sm">Brief explanation = better results</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toneOfVoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone of voice *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl className="text-md">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tone of voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="serious">Serious</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Separator orientation="horizontal" className="flex-1 h-px bg-muted" />
              <h2 className="text-md font-medium">Advance Settings (Optional)</h2>
              <Separator orientation="horizontal" className="flex-1 h-px bg-muted" />
            </div>
            <FormField
              control={form.control}
              name="customerAwarenessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Awareness Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-md">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unaware">Unaware</SelectItem>
                      <SelectItem value="problem-aware">Problem Aware</SelectItem>
                      <SelectItem value="solution-aware">Solution Aware</SelectItem>
                      <SelectItem value="product-aware">Product Aware</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketSophistication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Sophistication</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-md">
                        <SelectValue placeholder="Select Sophistication" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productionLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-md">
                        <SelectValue placeholder="Select Sophistication" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 p-4 border-t">
          <Button variant={"outline"}>Cancel</Button>
          <Button variant={"default"}>Save</Button>
        </div>
      </form>
    </Form>
  );
}
