import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const otpSchema = z.object({
  token: z.string().length(8, 'Code must be 8 digits'),
})

type SignInFormData = z.infer<typeof signInSchema>
type SignUpFormData = z.infer<typeof signUpSchema>
type OtpFormData = z.infer<typeof otpSchema>

type FormStep = 'signIn' | 'signUp' | 'verify'

export function LoginForm() {
  const [step, setStep] = useState<FormStep>('signIn')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  const handleSignIn = async (data: SignInFormData) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
    }
  }

  const handleSignUp = async (data: SignUpFormData) => {
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setPendingEmail(data.email)
      signUpForm.reset()
      otpForm.reset()
      setStep('verify')
      setSuccess('We sent an 8-digit code to your email. Enter it below to verify your account.')
    }
  }

  const handleVerifyOtp = async (data: OtpFormData) => {
    if (!pendingEmail) return
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: data.token,
      type: 'signup',
    })

    if (error) {
      setError(error.message)
    }
  }

  const resetToSignIn = () => {
    setStep('signIn')
    setPendingEmail(null)
    setError(null)
    setSuccess(null)
    signInForm.reset()
    signUpForm.reset()
    otpForm.reset()
  }

  // OTP Verification Step
  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 8-digit code sent to {pendingEmail}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            {success && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="token"
                type="text"
                inputMode="numeric"
                placeholder="12345678"
                maxLength={8}
                {...otpForm.register('token')}
              />
              {otpForm.formState.errors.token && (
                <p className="text-sm text-destructive">
                  {otpForm.formState.errors.token.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={otpForm.formState.isSubmitting}
            >
              {otpForm.formState.isSubmitting ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={resetToSignIn}
                className="text-primary underline-offset-4 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Sign Up Step
  if (step === 'signUp') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Enter your details to create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                {...signUpForm.register('email')}
              />
              {signUpForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {signUpForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                {...signUpForm.register('password')}
              />
              {signUpForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {signUpForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-confirm" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="signup-confirm"
                type="password"
                placeholder="••••••••"
                {...signUpForm.register('confirmPassword')}
              />
              {signUpForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {signUpForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={signUpForm.formState.isSubmitting}
            >
              {signUpForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('signIn')
                  setError(null)
                }}
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Sign In Step (default)
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your videos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="signin-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              {...signInForm.register('email')}
            />
            {signInForm.formState.errors.email && (
              <p className="text-sm text-destructive">
                {signInForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="signin-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              {...signInForm.register('password')}
            />
            {signInForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {signInForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={signInForm.formState.isSubmitting}
          >
            {signInForm.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setStep('signUp')
                setError(null)
              }}
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign Up
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
