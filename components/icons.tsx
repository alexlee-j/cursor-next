import { LucideProps, Moon, SunMedium, User } from "lucide-react";

export const Icons = {
  sun: SunMedium,
  moon: Moon,
  user: User,
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};
