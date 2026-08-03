import { useEffect, useState } from "react";
import { signTemplateUrl } from "@/lib/templateStorage";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  url?: string | null;
}

/** <img> for files in the private `templates` bucket — resolves a signed URL on mount. */
export function TemplateImage({ url, alt, ...rest }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    signTemplateUrl(url).then((u) => { if (active) setSrc(u); });
    return () => { active = false; };
  }, [url]);

  if (!src) return <div className={rest.className} aria-hidden />;
  return <img {...rest} src={src} alt={alt ?? ""} />;
}
