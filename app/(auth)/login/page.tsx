"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", values);

      localStorage.setItem("accessToken", data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      toast.success("Logged in successfully");

      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <Image
        src="/login_desk.webp"
        alt="Login background"
        fill
        className="object-cover absolute inset-0 -z-10"
        priority
      />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <Card className="relative w-full max-w-md border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl transition-all duration-300">
        <CardHeader className="flex flex-col items-center pb-6 pt-10">
          <div className="relative w-64 h-24">
            <Image
              src="/logo.png"
              alt="Biomoneta Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200 font-medium ml-1">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                        <Input
                          placeholder="name@example.com"
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:border-white/20 h-12 transition-all duration-300"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200 font-medium ml-1">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:border-white/20 h-12 transition-all duration-300"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="w-full bg-white hover:bg-zinc-100 text-black font-bold h-12 mt-4 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
