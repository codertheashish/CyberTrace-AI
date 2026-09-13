declare module 'leaflet.heat';

declare namespace L {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: Record<string, any>
  ): any;
}
