import type { ComponentType, SVGProps } from "react";
import { EventIcon } from "./icons/EventIcon";
import { RknIcon } from "./icons/RknIcon";
import { ServicesIcon } from "./icons/ServicesIcon";
import { SettingsIcon } from "./icons/SettingsIcon";

export type IconName = "settings" | "services" | "rkn" | "event";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const iconMap: Record<IconName, IconComponent> = {
  settings: SettingsIcon,
  services: ServicesIcon,
  rkn: RknIcon,
  event: EventIcon,
};
