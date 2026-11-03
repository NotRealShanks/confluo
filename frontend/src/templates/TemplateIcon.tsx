import {
  SiReact,
  SiVuedotjs,
  SiAngular,
  SiSpringboot,
  SiFlask,
  SiNodedotjs,
  SiHtml5,
} from "react-icons/si";
import { Code2, Box } from "lucide-react";

export function TemplateIcon({
  icon,
  className = "h-4 w-4",
}: {
  icon: string;
  className?: string;
}) {
  switch (icon) {
    case "react":
      return <SiReact className={className} />;
    case "vue":
      return <SiVuedotjs className={className} />;
    case "angular":
      return <SiAngular className={className} />;
    case "spring":
      return <SiSpringboot className={className} />;
    case "flask":
      return <SiFlask className={className} />;
    case "node":
      return <SiNodedotjs className={className} />;
    case "html":
      return <SiHtml5 className={className} />;
    case "code":
      return <Code2 className={className} />;
    default:
      return <Box className={className} />;
  }
}

