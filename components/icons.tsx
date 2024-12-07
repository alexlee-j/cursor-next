import {
  LucideProps,
  Moon,
  SunMedium,
  User,
  Plus,
  MoreVertical,
  Upload,
  Twitter,
  Github,
  Linkedin,
} from "lucide-react";

export const Icons = {
  sun: SunMedium,
  moon: Moon,
  user: User,
  add: Plus,
  more: MoreVertical,
  upload: Upload,
  twitter: Twitter,
  github: Github,
  linkedin: Linkedin,
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
