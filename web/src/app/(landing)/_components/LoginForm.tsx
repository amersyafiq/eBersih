"use client";

import { useActionState, useEffect, useRef, useState } from 'react'
import { FieldError } from "@/src/components/tailgrids/core/field";
import { Input } from "@/src/components/tailgrids/core/input";
import { InputGroup, InputGroupButton, InputGroupInput } from "@/src/components/tailgrids/core/input-group";
import { Label } from "@/src/components/tailgrids/core/label";
import { TextField } from "@/src/components/tailgrids/core/text-field";
import { EyeClose } from "./icons";
import { Eye } from "@tailgrids/icons";
import { Checkbox } from '@/src/components/tailgrids/core/checkbox';
import { Button } from '@/src/components/tailgrids/core/button';
import { login } from '@/src/lib/auth/action';
import { useFormStatus } from 'react-dom';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/src/components/tailgrids/core/spinner';

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [keepLogin, setKeepLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const [state, loginAction] = useActionState(login, undefined);
    const handledState = useRef<typeof state>(undefined);

    useEffect(() => {
        if (!state || state === handledState.current) return;
        handledState.current = state;

        if (state.status === "success") {
            toast.success(state.message);
            router.refresh()
        } else {
            toast.error(state.message);
        }
    }, [state, router]);

    return (
        <form action={loginAction} noValidate className="flex flex-col gap-4">
            <TextField className="w-full flex-col gap-1.5">
                <Label className="flex items-center gap-0.5 text-sm font-medium text-text-100">
                    Email Address <span className="ml-1 text-error-500">*</span>
                </Label>
                <Input
                    placeholder="user@example.com"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm"
                />
                <FieldError />
            </TextField>

            <TextField className="w-full gap-1.5">
                <Label className="flex items-center gap-0.5 text-sm font-medium text-text-100">
                    Password <span className="text-sm font-medium text-error-500">*</span>
                </Label>
                <InputGroup>
                    <InputGroupInput
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Choose a password"
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm"
                    />
                    <InputGroupButton
                        size="icon-sm"
                        className="mr-1 text-text-secondary hover:text-text-primary"
                        onPress={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeClose className="size-5" /> : <Eye className="size-5" />}
                    </InputGroupButton>
                </InputGroup>
                <FieldError />
            </TextField>

            <div className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="rememberMe"
                        name="rememberMe"
                        isSelected={keepLogin}
                    />
                    <Label htmlFor='rememberMe' className="cursor-pointer text-text-100 select-none">
                        Keep me logged in
                    </Label>
                </div>
                <a
                    className="font-medium text-title-50 underline hover:text-primary-500"
                    href="/auth/reset-password"
                    tabIndex={0}
                >
                    Forget Password?
                </a>
            </div>
            <SubmitButton />
        </form>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            className="flex items-center justify-center rounded-lg transition outline-none focus:ring-4 disabled:pointer-events-none bg-button-primary-background text-button-primary-text hover:bg-button-primary-hover-background gap-1.5 px-3.5 py-2 mt-2 h-11 w-full text-base font-medium shadow-sm"
            isDisabled={pending}
            type="submit"
        >
            {pending ? (
                <Spinner />
            ):(
                'Login'
            )}
        </Button>
    )
}
