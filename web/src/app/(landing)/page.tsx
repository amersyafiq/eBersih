import { Logo, LogoText } from "@/src/utils/icon";
import LoginForm from "./_components/LoginForm";

export default function LandingPage() {
	return (
		<main className="h-full overflow-y-auto">
			<div className="flex min-h-full w-full items-center justify-center">
				<div className="mx-auto h-screen w-full p-2">
					<div className="relative isolate flex h-full w-full flex-col items-center justify-between gap-20 overflow-hidden shadow-md md:p-3 lg:flex-row">
						
						{/* Background Video */}
						<video
							autoPlay
							loop
							muted
							playsInline
							className="absolute inset-0 h-full w-full object-cover rounded-[20px]"
						>
							<source src="/video/web_bg_vid.mp4" type="video/mp4" />
							Your browser does not support the video tag.
						</video>

						{/* Sidebar Visual Section */}
						<div className="relative h-full hidden w-full flex-3 shrink-0 flex-col items-start justify-between p-12 gap-3 overflow-hidden text-white lg:flex">
							<Logo width={100} height={100}/>
							<LogoText width={250} height={45}/>
						</div>

						{/* Form Section */}
						<div className="relative overflow-auto flex h-full w-full flex-2 flex-col items-center justify-center rounded-xl border border-base-200 bg-background-50 px-5 py-16 shadow-sm lg:max-w-211.5">

							<div className="flex w-full max-w-112.5 flex-col gap-6">
								<div className="flex flex-col gap-1 text-center">
									<h1 className="text-2xl font-bold tracking-tight text-title-50">
										Sign In
									</h1>
									<p className="text-sm text-text-100 dark:text-text-50">
										Welcome back! Please sign in with UiTM Official Email.
									</p>
								</div>

								{/* OAuth Buttons */}
								<div className="flex w-full flex-col gap-3 sm:flex-row">
									<button
										className="flex items-center justify-center rounded-lg transition outline-none focus:ring-4 disabled:pointer-events-none border border-base-200 w-full text-sm font-medium hover:bg-background-soft-100 gap-1.5 px-3.5 py-2 h-9.5 text-button-primary-outline-text bg-button-primary-outline-background dark:border-base-800 dark:hover:bg-base-800"
										type="button"
										tabIndex={0}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width={20}
											height={20}
											viewBox="0 0 20 20"
											fill="none"
											className="size-5 shrink-0"
										>
											<path
												d="M18.75 10.194c0-.72-.059-1.244-.188-1.789H10.18v3.248H15.1c-.1.807-.635 2.022-1.825 2.838l-.017.11 2.65 2.011.184.019c1.687-1.527 2.659-3.773 2.659-6.437z"
												fill="#4285F4"
											/>
											<path
												d="M10.179 18.75c2.41 0 4.434-.778 5.913-2.12l-2.818-2.138c-.754.515-1.766.875-3.095.875a5.365 5.365 0 01-5.08-3.637l-.104.01-2.756 2.09-.036.098c1.468 2.858 4.484 4.822 7.976 4.822z"
												fill="#34A853"
											/>
											<path
												d="M5.1 11.73A5.29 5.29 0 014.802 10c0-.603.11-1.186.288-1.73l-.005-.117-2.79-2.123-.092.042A8.616 8.616 0 001.251 10c0 1.41.347 2.742.952 3.928L5.1 11.73z"
												fill="#FBBC05"
											/>
											<path
												d="M10.179 4.633c1.676 0 2.807.71 3.452 1.303l2.52-2.411C14.604 2.115 12.59 1.25 10.18 1.25c-3.492 0-6.508 1.964-7.976 4.822L5.09 8.27a5.387 5.387 0 015.089-3.636z"
												fill="#EB4335"
											/>
										</svg>
										<span>Continue with Google</span>
									</button>
								</div>

								{/* Divider */}
								<div role="presentation" className="flex w-full items-center gap-3 py-2">
									<div className="h-px flex-1 bg-border-secondary-alt" />
									<span className="text-xs font-medium tracking-wider text-text-200 uppercase">
										OR
									</span>
									<div className="h-px flex-1 bg-border-secondary-alt" />
								</div>

								{/* Credentials Form */}
								<LoginForm />
								

								<div className="mt-1 text-center text-sm text-text-100 flex flex-col">
									<span className="whitespace-pre-line font-semibold text-primary-500 hover:text-primary-600">
										New here?
									</span>
									Please contact your employer for onboarding process
								</div>
							</div>
						</div>

						{/* Background Pattern Overlays */}
						<div
							role="presentation"
							className="absolute top-0 right-0 -z-1 h-1/2 w-full bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.20)_0,rgba(255,255,255,0.20)_1px,transparent_0,transparent_50%)] [background-size:10px_10px] lg:h-60"
						/>
						<div
							role="presentation"
							className="absolute right-0 bottom-0 -z-1 h-1/2 w-full bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.20)_0,rgba(255,255,255,0.20)_1px,transparent_0,transparent_50%)] [background-size:10px_10px] lg:h-60"
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
