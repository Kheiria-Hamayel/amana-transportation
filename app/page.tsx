"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

// --- 1. DATA STRUCTURES & STATIC DATA ---

// Define the URLs for Leaflet resources
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const MAP_ID = "leaflet-map";

// Define the global 'L' type for typescript clarity in this single-file context
declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

interface Incident {
  id: number;
  type: string;
  description: string;
  reported_by: string;
  reported_time: string;
  status: string;
  priority: string;
}

interface VehicleInfo {
  license_plate: string;
  model: string;
  year: number;
  fuel_level: number;
  last_maintenance: string;
}

interface RouteInfo {
  total_distance: number;
  average_speed: number;
  estimated_completion: string;
  frequency_minutes: number;
}

interface OperationalSummary {
  total_buses: number;
  active_buses: number;
  maintenance_buses: number;
  out_of_service_buses: number;
  total_capacity: number;
  current_passengers: number;
  average_utilization: number;
}

interface Filters {
  available_statuses: string[];
  available_routes: string[];
  applied: {
    status: string | null;
    busId: number | null;
    routeNumber: string | null;
  };
}

interface BusStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  estimated_arrival: string;
  is_next_stop: boolean;
}

interface Driver {
  name: string;
  id: string;
  shift_start: string;
  shift_end: string;
}

interface BusLine {
  id: number;
  name: string;
  route_number: string;
  current_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: "Active" | "Maintenance" | "Out of Service";
  passengers: {
    current: number;
    capacity: number;
    utilization_percentage: number;
  };
  bus_stops: BusStop[];
  driver: Driver;
  incidents: Incident[]; // Added incidents
  vehicle_info: VehicleInfo; // Added vehicle_info
  route_info: RouteInfo;
}

interface Dataset {
  message: string;
  company_info: {
    name: string;
    founded: string;
    headquarters: string;
    industry: string;
    description: string;
  };
  bus_lines: BusLine[];
  operational_summary: OperationalSummary; // Added operational_summary
  filters: Filters;
}

// Replicating the raw data structure
const rawData: Dataset = {
  message: "Amana Transportation bus data retrieved successfully",
  company_info: {
    name: "Amana Transportation",
    founded: "2019",
    headquarters: "Kuala Lumpur, Malaysia",
    industry: "Public Transportation",
    description:
      "Modern public bus service connecting key areas in Kuala Lumpur and surrounding regions, focused on reliability and passenger comfort.",
  },
  bus_lines: [
    {
      id: 1,
      name: "KLCC - Petaling Jaya Express",
      route_number: "B101",
      current_location: {
        latitude: 3.158,
        longitude: 101.711,
        address: "Jalan Ampang, near KLCC Twin Towers, Kuala Lumpur",
      },
      status: "Active",
      passengers: {
        current: 32,
        capacity: 45,
        utilization_percentage: 71,
      },
      driver: {
        name: "Ahmad Rahman",
        id: "DRV001",
        shift_start: "06:00",
        shift_end: "18:00",
      },
      bus_stops: [
        {
          id: 1,
          name: "KLCC Station",
          latitude: 3.1578,
          longitude: 101.7114,
          estimated_arrival: "14:20",
          is_next_stop: true,
        },
        {
          id: 2,
          name: "Pavilion KL",
          latitude: 3.149,
          longitude: 101.7101,
          estimated_arrival: "14:28",
          is_next_stop: false,
        },
        {
          id: 3,
          name: "Mid Valley Megamall",
          latitude: 3.1177,
          longitude: 101.6774,
          estimated_arrival: "14:42",
          is_next_stop: false,
        },
        {
          id: 4,
          name: "KL Sentral",
          latitude: 3.1338,
          longitude: 101.6869,
          estimated_arrival: "14:50",
          is_next_stop: false,
        },
        {
          id: 5,
          name: "Universiti Malaya",
          latitude: 3.1204,
          longitude: 101.6535,
          estimated_arrival: "15:05",
          is_next_stop: false,
        },
        {
          id: 6,
          name: "Petaling Jaya SS2",
          latitude: 3.1147,
          longitude: 101.624,
          estimated_arrival: "15:18",
          is_next_stop: false,
        },
        {
          id: 7,
          name: "1 Utama Shopping Centre",
          latitude: 3.1502,
          longitude: 101.6154,
          estimated_arrival: "15:35",
          is_next_stop: false,
        },
      ],
      incidents: [
        {
          id: 1,
          type: "Weather",
          description: "Flood on route",
          reported_by: "Driver-1A",
          reported_time: "2:06 AM",
          status: "Resolved",
          priority: "Low",
        },
      ],
      vehicle_info: {
        license_plate: "WKL 2891",
        model: "Scania K230UB",
        year: 2019,
        fuel_level: 75,
        last_maintenance: "2024-12-01",
      },
      route_info: {
        total_distance: 28.5,
        average_speed: 25,
        estimated_completion: "16:00",
        frequency_minutes: 20,
      },
    },
    {
      id: 2,
      name: "Old Town - Mont Kiara Connector",
      route_number: "B205",
      current_location: {
        latitude: 3.139,
        longitude: 101.6869,
        address: "KL Sentral Transportation Hub, Kuala Lumpur",
      },
      status: "Active",
      passengers: {
        current: 28,
        capacity: 40,
        utilization_percentage: 70,
      },
      driver: {
        name: "Siti Aminah",
        id: "DRV002",
        shift_start: "05:30",
        shift_end: "17:30",
      },
      bus_stops: [
        {
          id: 1,
          name: "KL Sentral",
          latitude: 3.1338,
          longitude: 101.6869,
          estimated_arrival: "14:15",
          is_next_stop: false,
        },
        {
          id: 2,
          name: "Central Market",
          latitude: 3.1427,
          longitude: 101.6964,
          estimated_arrival: "14:25",
          is_next_stop: true,
        },
        {
          id: 3,
          name: "Chinatown",
          latitude: 3.1436,
          longitude: 101.6958,
          estimated_arrival: "14:30",
          is_next_stop: false,
        },
        {
          id: 4,
          name: "Titiwangsa LRT",
          latitude: 3.1729,
          longitude: 101.7016,
          estimated_arrival: "14:45",
          is_next_stop: false,
        },
        {
          id: 5,
          name: "Mont Kiara",
          latitude: 3.1727,
          longitude: 101.6509,
          estimated_arrival: "15:00",
          is_next_stop: false,
        },
        {
          id: 6,
          name: "Sri Hartamas",
          latitude: 3.1653,
          longitude: 101.6493,
          estimated_arrival: "15:10",
          is_next_stop: false,
        },
      ],
      incidents: [
        {
          id: 1,
          type: "Traffic",
          description: "Heavy traffic jam",
          reported_by: "Driver-2A",
          reported_time: "5:32 PM",
          status: "Resolved",
          priority: "High",
        },
      ],
      vehicle_info: {
        license_plate: "WKL 1547",
        model: "Mercedes-Benz Citaro",
        year: 2020,
        fuel_level: 60,
        last_maintenance: "2024-11-28",
      },
      route_info: {
        total_distance: 22.3,
        average_speed: 22,
        estimated_completion: "15:30",
        frequency_minutes: 25,
      },
    },
    {
      id: 3,
      name: "Airport - City Circle",
      route_number: "B350",
      current_location: {
        latitude: 2.7456,
        longitude: 101.7072,
        address: "KLIA Express Station, Sepang, Selangor",
      },
      status: "Active",
      passengers: {
        current: 15,
        capacity: 50,
        utilization_percentage: 30,
      },
      driver: {
        name: "Lim Wei Ming",
        id: "DRV003",
        shift_start: "04:00",
        shift_end: "16:00",
      },
      bus_stops: [
        {
          id: 1,
          name: "KLIA Terminal 1",
          latitude: 2.7456,
          longitude: 101.7072,
          estimated_arrival: "14:30",
          is_next_stop: false,
        },
        {
          id: 2,
          name: "KLIA Terminal 2",
          latitude: 2.7389,
          longitude: 101.6997,
          estimated_arrival: "14:40",
          is_next_stop: false,
        },
        {
          id: 3,
          name: "Putrajaya Central",
          latitude: 2.9264,
          longitude: 101.6964,
          estimated_arrival: "15:10",
          is_next_stop: true,
        },
        {
          id: 4,
          name: "Cyberjaya",
          latitude: 2.9213,
          longitude: 101.6543,
          estimated_arrival: "15:25",
          is_next_stop: false,
        },
        {
          id: 5,
          name: "Bandar Tun Razak",
          latitude: 3.0733,
          longitude: 101.7317,
          estimated_arrival: "15:55",
          is_next_stop: false,
        },
        {
          id: 6,
          name: "KL City Centre",
          latitude: 3.1519,
          longitude: 101.7077,
          estimated_arrival: "16:20",
          is_next_stop: false,
        },
        {
          id: 7,
          name: "Batu Caves",
          latitude: 3.2379,
          longitude: 101.684,
          estimated_arrival: "16:45",
          is_next_stop: false,
        },
        {
          id: 8,
          name: "Gombak Terminal",
          latitude: 3.2642,
          longitude: 101.7003,
          estimated_arrival: "17:00",
          is_next_stop: false,
        },
      ],
      incidents: [
        {
          id: 1,
          type: "Mechanical",
          description: "AC malfunction",
          reported_by: "Driver-3A",
          reported_time: "3:33 PM",
          status: "Resolved",
          priority: "Critical",
        },
      ],
      vehicle_info: {
        license_plate: "WKL 3429",
        model: "Volvo B8RLE",
        year: 2018,
        fuel_level: 40,
        last_maintenance: "2024-12-03",
      },
      route_info: {
        total_distance: 85.2,
        average_speed: 35,
        estimated_completion: "17:30",
        frequency_minutes: 45,
      },
    },
    {
      id: 4,
      name: "University Express",
      route_number: "B410",
      current_location: {
        latitude: 3.1204,
        longitude: 101.6535,
        address: "Universiti Malaya Main Campus, Kuala Lumpur",
      },
      status: "Maintenance",
      passengers: {
        current: 0,
        capacity: 35,
        utilization_percentage: 0,
      },
      driver: {
        name: "Raj Kumar",
        id: "DRV004",
        shift_start: "06:30",
        shift_end: "18:30",
      },
      bus_stops: [
        {
          id: 1,
          name: "Universiti Malaya",
          latitude: 3.1204,
          longitude: 101.6535,
          estimated_arrival: "N/A",
          is_next_stop: false,
        },
        {
          id: 2,
          name: "UCSI University",
          latitude: 3.0411,
          longitude: 101.7089,
          estimated_arrival: "N/A",
          is_next_stop: false,
        },
        {
          id: 3,
          name: "Taylor's University",
          latitude: 3.0653,
          longitude: 101.6075,
          estimated_arrival: "N/A",
          is_next_stop: false,
        },
        {
          id: 4,
          name: "Sunway University",
          latitude: 3.0653,
          longitude: 101.6037,
          estimated_arrival: "N/A",
          is_next_stop: false,
        },
        {
          id: 5,
          name: "INTI International University",
          latitude: 3.0534,
          longitude: 101.5934,
          estimated_arrival: "N/A",
          is_next_stop: false,
        },
        {
          id: 6,
          name: "Monash University Malaysia",
          latitude: 3.0653,
          longitude: 101.6016,
          estimated_arrival: "N/A",
          is_next_stop: false,
        },
      ],
      incidents: [
        {
          id: 1,
          type: "Weather",
          description: "Storm warning",
          reported_by: "Driver-4A",
          reported_time: "1:56 AM",
          status: "Resolved",
          priority: "High",
        },
        {
          id: 2,
          type: "Weather",
          description: "Storm warning",
          reported_by: "Driver-4B",
          reported_time: "5:17 AM",
          status: "Reported",
          priority: "High",
        },
      ],
      vehicle_info: {
        license_plate: "WKL 7856",
        model: "Isuzu NPR",
        year: 2017,
        fuel_level: 85,
        last_maintenance: "2024-12-05",
      },
      route_info: {
        total_distance: 45.8,
        average_speed: 20,
        estimated_completion: "N/A",
        frequency_minutes: 30,
      },
    },
    {
      id: 5,
      name: "Shopping District Shuttle",
      route_number: "B520",
      current_location: {
        latitude: 3.149,
        longitude: 101.7101,
        address: "Pavilion Kuala Lumpur, Bukit Bintang",
      },
      status: "Active",
      passengers: {
        current: 42,
        capacity: 45,
        utilization_percentage: 93,
      },
      driver: {
        name: "Fatimah Zahra",
        id: "DRV005",
        shift_start: "07:00",
        shift_end: "19:00",
      },
      bus_stops: [
        {
          id: 1,
          name: "Pavilion KL",
          latitude: 3.149,
          longitude: 101.7101,
          estimated_arrival: "14:22",
          is_next_stop: false,
        },
        {
          id: 2,
          name: "Lot 10 Shopping Centre",
          latitude: 3.1479,
          longitude: 101.71,
          estimated_arrival: "14:25",
          is_next_stop: true,
        },
        {
          id: 3,
          name: "Times Square KL",
          latitude: 3.1427,
          longitude: 101.7105,
          estimated_arrival: "14:32",
          is_next_stop: false,
        },
        {
          id: 4,
          name: "Suria KLCC",
          latitude: 3.158,
          longitude: 101.7123,
          estimated_arrival: "14:40",
          is_next_stop: false,
        },
        {
          id: 5,
          name: "Avenue K",
          latitude: 3.1612,
          longitude: 101.7197,
          estimated_arrival: "14:48",
          is_next_stop: false,
        },
        {
          id: 6,
          name: "Intermark Mall",
          latitude: 3.1606,
          longitude: 101.7209,
          estimated_arrival: "14:52",
          is_next_stop: false,
        },
        {
          id: 7,
          name: "Ampang Park LRT",
          latitude: 3.1615,
          longitude: 101.713,
          estimated_arrival: "15:00",
          is_next_stop: false,
        },
        {
          id: 8,
          name: "Low Yat Plaza",
          latitude: 3.1468,
          longitude: 101.7099,
          estimated_arrival: "15:08",
          is_next_stop: false,
        },
        {
          id: 9,
          name: "Fahrenheit 88",
          latitude: 3.1472,
          longitude: 101.7097,
          estimated_arrival: "15:12",
          is_next_stop: false,
        },
      ],
      incidents: [
        {
          id: 1,
          type: "Passenger",
          description: "Lost item report",
          reported_by: "Driver-5A",
          reported_time: "7:08 AM",
          status: "Canceled",
          priority: "Low",
        },
      ],
      vehicle_info: {
        license_plate: "WKL 9123",
        model: "BYD K9",
        year: 2021,
        fuel_level: 95,
        last_maintenance: "2024-11-30",
      },
      route_info: {
        total_distance: 12.7,
        average_speed: 15,
        estimated_completion: "15:30",
        frequency_minutes: 15,
      },
    },
  ],
  operational_summary: {
    total_buses: 5,
    active_buses: 4,
    maintenance_buses: 1,
    out_of_service_buses: 0,
    total_capacity: 215,
    current_passengers: 117,
    average_utilization: 53,
  },
  filters: {
    available_statuses: ["Active", "Maintenance", "Out of Service"],
    available_routes: ["B101", "B205", "B350", "B410", "B520"],
    applied: {
      status: null,
      busId: null,
      routeNumber: null,
    },
  },
};

// --- 2. Leaflet Map Component (Pure React/JS) ---

const MapWrapper = ({ selectedBus }: { selectedBus: BusLine | null }) => {
  // Use a ref to hold the Leaflet map instance
  const mapRef = React.useRef(null);
  // Use a ref to hold references to the dynamically added Leaflet layers (markers, polyline)
  const layerRefs = React.useRef<{ bus?: any; stops: any[]; polyline?: any }>({
    stops: [],
  });
  // State to track when the Leaflet script has successfully loaded
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // 1. Load Leaflet scripts and styles dynamically (Runs only once on mount)
  useEffect(() => {
    // Check if L is already loaded to prevent redundant loading in HMR environments
    if (typeof window.L !== "undefined") {
      setLeafletLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS_URL;
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = LEAFLET_JS_URL;
    script.onload = () => {
      // Set state once the script is confirmed to be loaded and L is available
      if (typeof window.L !== "undefined") {
        setLeafletLoaded(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove the dynamically added elements on unmount
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  // 2. Initialize and Update Map (Runs when Leaflet loads or selectedBus changes)
  useEffect(() => {
    // Cannot proceed if Leaflet hasn't loaded successfully
    if (!leafletLoaded || typeof window.L === "undefined") return;

    // Type casting the global L object for usage
    const L = window.L as any;
    let timeoutId: number | undefined; // Declare outside of initialization block for cleanup

    // --- INITIALIZATION (Run only once) ---
    if (!mapRef.current) {
      const initialCenter: [number, number] = [3.140853, 101.693207]; // Center: Kuala Lumpur

      try {
        const map = L.map(MAP_ID, {
          center: initialCenter,
          zoom: 12,
          zoomControl: false,
        });
        mapRef.current = map;

        // Add Tile Layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Invalidate size immediately after initialization to force render (Crucial Fix)
        // Using setTimeout(100) helps ensure the map container is fully measured by the DOM
        // after the initial React render cycle.
        timeoutId = window.setTimeout(() => {
          map.invalidateSize();
        }, 100);

        // Apply grayscale filter manually via map container style
        const container = document.getElementById(MAP_ID);
        if (container) {
          container.style.filter = "grayscale(100%)";
        }
      } catch (error) {
        console.error("Leaflet map initialization failed:", error);
        return;
      }
    }

    // Map must be initialized to proceed with updates
    const map = mapRef.current as any;
    if (!map) return;

    // --- Cleanup Previous Layers ---
    if (layerRefs.current.polyline) {
      map.removeLayer(layerRefs.current.polyline);
      layerRefs.current.polyline = undefined;
    }
    layerRefs.current.stops.forEach((marker) => map.removeLayer(marker));
    layerRefs.current.stops = [];
    if (layerRefs.current.bus) {
      map.removeLayer(layerRefs.current.bus);
      layerRefs.current.bus = undefined;
    }

    // --- Render Selected Bus Route ---
    if (selectedBus) {
      const busLocation: [number, number] = [
        selectedBus.current_location.latitude,
        selectedBus.current_location.longitude,
      ];

      // =========================================================================
      // START: BUS ICON DEFINITION (Change appearance here)
      // This uses Tailwind classes (bg-blue-600, animate-pulse) and an inline SVG
      // to create a custom marker for the current bus location.
      //
      // Changed: Color to blue and added a pulse animation for visibility.
      // =========================================================================
      const busIconHtml = `<div class="p-1 rounded-full bg-blue-600 shadow-xl border-2 border-white text-lg animate-pulse" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18l.842-.714.493-.417m1.564 1.25c.097.35.347.618.665.753.385.16.822.148 1.196-.039a1.063 1.063 0 00.587-.665m3.714-3.714L16.5 13.5M19.5 8.25V5.25A2.25 2.25 0 0017.25 3h-7.5a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25h8.25a2.25 2.25 0 002.25-2.25V12.75" />
        </svg>
      </div>`;
      const busIcon = L.divIcon({
        html: busIconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "",
      });
      // END: BUS ICON DEFINITION

      // =========================================================================
      // START: STOP ICON DEFINITION (Change appearance here)
      // This uses Tailwind classes (bg-purple-600) to create a custom marker
      // for the bus stop locations.
      //
      // Changed: Color to purple and made it look like a target.
      // =========================================================================
      const stopIconHtml = `<div class="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center border-2 border-white shadow-lg">
        <div class="w-2 h-2 rounded-full bg-white border border-purple-800"></div>
      </div>`;
      const stopIcon = L.divIcon({
        html: stopIconHtml,
        iconSize: [20, 20], // Adjusted size
        iconAnchor: [10, 10], // Adjusted anchor
        className: "",
      });
      // END: STOP ICON DEFINITION
      // =========================================================================

      // 1. Draw Polyline (Route)
      const polylineCoords: [number, number][] = [
        busLocation,
        ...selectedBus.bus_stops.map(
          (s) => [s.latitude, s.longitude] as [number, number]
        ),
      ];
      // THE LINE COLOR IS DEFINED HERE:
      const polyline = L.polyline(polylineCoords, {
        color: "#E04E4E", // <-- Change this hex code for the line color
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 5",
      }).addTo(map);
      layerRefs.current.polyline = polyline;

      // 2. Render Bus Stop Markers
      selectedBus.bus_stops.forEach((stop) => {
        const stopMarker = L.marker([stop.latitude, stop.longitude], {
          icon: stopIcon,
        }).addTo(map);

        // Stop Popup Content
        const stopPopupContent = `
          <div class="font-sans font-semibold">
            <p class="text-base text-gray-800">${stop.name}</p>
            <p class="text-xs text-gray-600 mt-1">
              Arrival: <span class="font-bold text-green-600">${stop.estimated_arrival}</span>
            </p>
          </div>
        `;
        stopMarker.bindPopup(stopPopupContent, {
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
        });
        layerRefs.current.stops.push(stopMarker);
      });

      // 3. Render Current Bus Location Marker
      if (selectedBus.status === "Active") {
        const nextStopName =
          selectedBus.bus_stops.find((s) => s.is_next_stop)?.name || "N/A";
        const busMarker = L.marker(busLocation, { icon: busIcon }).addTo(map);

        // Bus Popup Content
        const busPopupContent = `
          <div class="font-sans font-semibold text-center p-1 min-w-[150px]">
            <p class="text-lg font-extrabold text-blue-700">Bus ${selectedBus.route_number}</p>
            <p class="text-xs text-gray-700 mt-1">Status: <span class="font-bold">${selectedBus.status}</span></p>
            <p class="text-xs text-gray-700">Load: <span class="font-bold text-blue-500">${selectedBus.passengers.current} / ${selectedBus.passengers.capacity} (${selectedBus.passengers.utilization_percentage}%)</span></p>
            <p class="text-sm text-gray-800 mt-2">
              Next: <span class="font-extrabold text-orange-500">${nextStopName}</span>
            </p>
          </div>
        `;
        busMarker
          .bindPopup(busPopupContent, {
            closeButton: false,
            autoClose: false,
            closeOnClick: false,
          })
          .openPopup();
        layerRefs.current.bus = busMarker;
      }

      // 4. Adjust Map Bounds to fit the new route
      const allCoords: [number, number][] = polylineCoords;
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (mapRef.current) {
      // If no bus is selected, reset the view to KL center
      map.setView([3.140853, 101.693207], 12);
    }

    // Add cleanup to clear the timeout if the component unmounts before it fires
    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [selectedBus, leafletLoaded]);

  return (
    <div
      id={MAP_ID}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Loading Indicator */}
      {!leafletLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/70 backdrop-blur-sm rounded-b-xl">
          <p className="text-gray-700 font-medium text-lg animate-pulse">
            Loading Map Resources...
          </p>
        </div>
      )}
    </div>
  );
};

// --- 3. MAIN APP COMPONENT ---

export default function AmanaTransportationApp() {
  const allBusLines = rawData.bus_lines;
  // State to track which bus line is currently selected
  const [selectedBusId, setSelectedBusId] = useState<number | null>(
    allBusLines.find((b) => b.status === "Active")?.id ||
      allBusLines[0]?.id ||
      null
  );

  // State for dark/light mode
  const [darkMode, setDarkMode] = useState(false);

  // Derived state: Get the currently selected bus route data
  const selectedBus = useMemo(
    () => allBusLines.find((bus) => bus.id === selectedBusId) || null,
    [allBusLines, selectedBusId]
  );

  const handleBusSelect = useCallback((id: number) => {
    setSelectedBusId(id);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // --- RENDERING HELPERS ---

  const renderBusButtons = (isScheduleSection = false) => (
    <div className="flex flex-wrap gap-2 justify-center p-4">
      {allBusLines.map((bus) => {
        const isActive = bus.status === "Active";
        const isSelected = bus.id === selectedBusId;

        let baseClasses =
          "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border-2 shadow-md";
        let colorClasses =
          "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600";

        if (bus.status === "Active") {
          colorClasses = isSelected
            ? "bg-blue-600 text-white border-blue-700 shadow-xl hover:bg-blue-700 dark:bg-blue-700 dark:border-blue-800 dark:hover:bg-blue-800" // Changed green to blue here to match map icon
            : "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800";
        } else if (bus.status === "Maintenance") {
          colorClasses = isSelected
            ? "bg-orange-600 text-white border-orange-700 shadow-xl hover:bg-orange-700 dark:bg-orange-700 dark:border-orange-800 dark:hover:bg-orange-800"
            : "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-800";
        } else {
          colorClasses = isSelected
            ? "bg-red-600 text-white border-red-700 shadow-xl hover:bg-red-700 dark:bg-red-700 dark:border-red-800 dark:hover:bg-red-800"
            : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-800";
        }

        // Apply distinct style for schedule
        if (isScheduleSection && isSelected) {
          baseClasses = baseClasses.replace(
            "shadow-md",
            "shadow-lg ring-2 ring-offset-2 ring-blue-500"
          );
        }

        return (
          <button
            key={bus.id}
            onClick={() => handleBusSelect(bus.id)}
            className={`${baseClasses} ${colorClasses}`}
            // Allow selection on both sections
          >
            {bus.route_number} ({bus.status === "Active" ? "Active" : "Maint."})
          </button>
        );
      })}
    </div>
  );

  const renderScheduleTable = () => {
    if (!selectedBus)
      return (
        <p className="text-center text-gray-500 p-4 dark:text-gray-400">
          Select a bus route to view the schedule.
        </p>
      );

    return (
      <div className="overflow-x-auto shadow-inner rounded-b-xl mx-4 mb-4 border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:bg-gray-800 dark:text-gray-300">
                Bus Stop
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:bg-gray-800 dark:text-gray-300">
                Next Time of Arrival
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {selectedBus.bus_stops.map((stop) => (
              <tr
                key={stop.id}
                className={
                  stop.is_next_stop
                    ? "bg-blue-100 transition-colors duration-300 dark:bg-blue-900"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              >
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    stop.is_next_stop
                      ? "text-blue-900 font-bold dark:text-blue-100"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {stop.name}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    stop.is_next_stop
                      ? "text-blue-900 font-bold dark:text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {stop.estimated_arrival}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- MAIN RENDER ---

  return (
    <div
      className={`min-h-screen font-sans flex flex-col items-center transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800 text-white"
          : "bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <header className="w-full py-6 px-4 text-center">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex-1"></div>
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">
              {rawData.company_info.name}
            </h1>
            <p className="text-lg mt-2 opacity-90">
              {rawData.company_info.description}
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            {/* Dark/Light Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-300 shadow-lg ${
                darkMode
                  ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl px-4 pb-8">
        {/* Route Selection */}
        <section className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 dark:bg-gray-800/80 dark:border-gray-700/50">
            <h2 className="text-2xl font-bold text-center py-4 border-b border-gray-200 dark:border-gray-700">
              Select Bus Route
            </h2>
            {renderBusButtons()}
          </div>
        </section>

        {/* Map & Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <section className="h-[500px] lg:h-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 h-full flex flex-col dark:bg-gray-800/80 dark:border-gray-700/50">
              <h2 className="text-2xl font-bold text-center py-4 border-b border-gray-200 dark:border-gray-700">
                Live Route Map
              </h2>
              <div className="flex-1 p-2 rounded-b-2xl overflow-hidden">
                <MapWrapper selectedBus={selectedBus} />
              </div>
            </div>
          </section>

          {/* Schedule Section */}
          <section className="h-[500px] lg:h-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 h-full flex flex-col dark:bg-gray-800/80 dark:border-gray-700/50">
              <h2 className="text-2xl font-bold text-center py-4 border-b border-gray-200 dark:border-gray-700">
                Bus Schedule
              </h2>
              <div className="flex-1 overflow-y-auto rounded-b-2xl">
                {renderScheduleTable()}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 text-center border-t border-gray-300/30 dark:border-gray-600/30">
        <p className="text-sm opacity-75">
          © 2025 {rawData.company_info.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
