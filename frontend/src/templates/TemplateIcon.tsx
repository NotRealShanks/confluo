import {
  SiReact,
  SiVuedotjs,
  SiAngular,
  SiSvelte,
  SiSolid,
  SiNodedotjs,
  SiHtml5,
  SiPython,
  SiCplusplus,
  SiRust,
  SiGo,
  SiOpenjdk,
  SiSpringboot,
  SiFlask,
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
    case "svelte":
      return <SiSvelte className={className} />;
    case "solid":
      return <SiSolid className={className} />;
    case "node":
      return <SiNodedotjs className={className} />;
    case "html":
      return <SiHtml5 className={className} />;
    case "python":
      return <SiPython className={className} />;
    case "cpp":
      return <SiCplusplus className={className} />;
    case "rust":
      return <SiRust className={className} />;
    case "go":
      return <SiGo className={className} />;
    case "java":
      return <SiOpenjdk className={className} />;
    case "spring":
      return <SiSpringboot className={className} />;
    case "flask":
      return <SiFlask className={className} />;
    case "code":
      return <Code2 className={className} />;
    default:
      return <Box className={className} />;
  }
}
