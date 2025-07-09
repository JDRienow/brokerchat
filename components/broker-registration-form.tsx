import Form from 'next/form';

import { Input } from './ui/input';
import { Label } from './ui/label';

export function BrokerRegistrationForm({
  action,
  children,
  defaultEmail = '',
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="first_name"
            className="text-zinc-600 font-normal dark:text-zinc-400"
          >
            First Name
          </Label>
          <Input
            id="first_name"
            name="first_name"
            className="bg-muted text-md md:text-sm"
            type="text"
            placeholder="John"
            autoComplete="given-name"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="last_name"
            className="text-zinc-600 font-normal dark:text-zinc-400"
          >
            Last Name
          </Label>
          <Input
            id="last_name"
            name="last_name"
            className="bg-muted text-md md:text-sm"
            type="text"
            placeholder="Doe"
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="company_name"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Company Name (Optional)
        </Label>
        <Input
          id="company_name"
          name="company_name"
          className="bg-muted text-md md:text-sm"
          type="text"
          placeholder="ABC Real Estate"
          autoComplete="organization"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="phone"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Phone Number (Optional)
        </Label>
        <Input
          id="phone"
          name="phone"
          className="bg-muted text-md md:text-sm"
          type="tel"
          placeholder="(555) 123-4567"
          autoComplete="tel"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>
        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          placeholder="At least 6 characters"
          required
        />
      </div>

      {children}
    </Form>
  );
}
