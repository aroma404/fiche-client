/** Lien privé qui charge d’abord le module cible : l’écran courant reste visible plutôt que d’afficher le fallback Suspense. */

import { startTransition, type AnchorHTMLAttributes } from "react";
import { useLocation } from "wouter";
import { preloadPrivateRoute } from "@/routes/private-route-preload";

type FastPrivateLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function FastPrivateLink({ href, onClick, onFocus, onPointerEnter, onPointerDown, ...props }: FastPrivateLinkProps) {
  const [, setLocation] = useLocation();
  const prefetch = () => { void preloadPrivateRoute(href); };
  const navigate = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    await preloadPrivateRoute(href);
    await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
    startTransition(() => setLocation(href));
  };
  return <a {...props} href={href} onFocus={event => { prefetch(); onFocus?.(event); }} onPointerEnter={event => { prefetch(); onPointerEnter?.(event); }} onPointerDown={event => { prefetch(); onPointerDown?.(event); }} onClick={navigate} />;
}
