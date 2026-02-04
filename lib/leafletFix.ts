import L from "leaflet";

// Fix missing marker icons in bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export function applyLeafletIconFix() {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: (markerIcon2x as any).src ?? markerIcon2x,
    iconUrl: (markerIcon as any).src ?? markerIcon,
    shadowUrl: (markerShadow as any).src ?? markerShadow,
  });
}
