export interface Route {
  id: string;
  name: string;
  category: string;
  routeNumber: number;
  path: string;
}

export interface RouteCategory {
  id: string;
  name: string;
  description: string;
  routes: Route[];
}

export const ROUTE_CATEGORIES: RouteCategory[] = [
  // 1: Basics
  {
    id: 'onwayroad',
    name: 'One-way Roads',
    description: '',
    routes: [
      { id: 'onwayroad1', name: 'One-way Road 1', category: 'onwayroad', routeNumber: 1, path: '/newtopo/routes/onwayroad1' },
      { id: 'onwayroad2', name: 'One-way Road 2', category: 'onwayroad', routeNumber: 2, path: '/newtopo/routes/onwayroad2' },
      { id: 'onwayroad3', name: 'One-way Road 3', category: 'onwayroad', routeNumber: 3, path: '/newtopo/routes/onwayroad3' },
      { id: 'onwayroad4', name: 'One-way Road 4', category: 'onwayroad', routeNumber: 4, path: '/newtopo/routes/onwayroad4' }
    ]
  },
  {
    id: 'keepingleft',
    name: 'Two-way Roads',
    description: '',
    routes: [
      { id: 'keepingleft1', name: 'Two-way Road 1', category: 'keepingleft', routeNumber: 1, path: '/newtopo/routes/keepingleft1' },
      { id: 'keepingleft2', name: 'Two-way Road 2', category: 'keepingleft', routeNumber: 2, path: '/newtopo/routes/keepingleft2' },
      { id: 'keepingleft3', name: 'Two-way Road 3', category: 'keepingleft', routeNumber: 3, path: '/newtopo/routes/keepingleft3' }
    ]
  },
  {
    id: 'roundabouts',
    name: 'Roundabouts',
    description: '',
    routes: [
      { id: 'roundabouts1', name: 'Roundabout 1', category: 'roundabouts', routeNumber: 1, path: '/newtopo/routes/roundabouts1' },
      { id: 'roundabouts2', name: 'Roundabout 2', category: 'roundabouts', routeNumber: 2, path: '/newtopo/routes/roundabouts2' },
      { id: 'roundabouts3', name: 'Roundabout 3', category: 'roundabouts', routeNumber: 3, path: '/newtopo/routes/roundabouts3' }
    ]
  },

  // 2: Pass through
  {
    id: 'railwaylines',
    name: 'Railway Lines',
    description: '',
    routes: [
      { id: 'railwaylines1', name: 'Railway Line 1', category: 'railwaylines', routeNumber: 1, path: '/newtopo/routes/railwaylines1' },
      { id: 'railwaylines2', name: 'Railway Line 2', category: 'railwaylines', routeNumber: 2, path: '/newtopo/routes/railwaylines2' },
      { id: 'railwaylines3', name: 'Railway Line 3', category: 'railwaylines', routeNumber: 3, path: '/newtopo/routes/railwaylines3' }
    ]
  },
  {
    id: 'footbridges',
    name: 'Footbridges',
    description: '',
    routes: [
      { id: 'footbridges1', name: 'Footbridge 1', category: 'footbridges', routeNumber: 1, path: '/newtopo/routes/footbridges1' },
      { id: 'footbridges2', name: 'Footbridge 2', category: 'footbridges', routeNumber: 2, path: '/newtopo/routes/footbridges2' }
    ]
  },
  {
    id: 'footpaths',
    name: 'Footpaths',
    description: '',
    routes: [
      { id: 'footpaths1', name: 'Footpath 1', category: 'footpaths', routeNumber: 1, path: '/newtopo/routes/footpaths1' },
      { id: 'footpaths2', name: 'Footpath 2', category: 'footpaths', routeNumber: 2, path: '/newtopo/routes/footpaths2' }
    ]
  },

  // 3: No Access
  {
    id: 'deadends',
    name: 'Dead Ends',
    description: '',
    routes: [
      { id: 'deadends1', name: 'Dead End 1', category: 'deadends', routeNumber: 1, path: '/newtopo/routes/deadends1' },
      { id: 'deadends2', name: 'Dead End 2', category: 'deadends', routeNumber: 2, path: '/newtopo/routes/deadends2' },
      { id: 'deadends3', name: 'Dead End 3', category: 'deadends', routeNumber: 3, path: '/newtopo/routes/deadends3' },
      { id: 'deadends4', name: 'Dead End 4', category: 'deadends', routeNumber: 4, path: '/newtopo/routes/deadends4' }
    ]
  },
  {
    id: 'restrictedaccess',
    name: 'Restricted Access',
    description: '',
    routes: [
      { id: 'restrictedaccess1', name: 'Restricted Access 1', category: 'restrictedaccess', routeNumber: 1, path: '/newtopo/routes/restrictedaccess1' },
      { id: 'restrictedaccess2', name: 'Restricted Access 2', category: 'restrictedaccess', routeNumber: 2, path: '/newtopo/routes/restrictedaccess2' }
    ]
  },
  {
    id: 'pedestrianzone',
    name: 'Pedestrian Zones',
    description: '',
    routes: [
      { id: 'pedestrianzone1', name: 'Pedestrian Zone 1', category: 'pedestrianzone', routeNumber: 1, path: '/newtopo/routes/pedestrianzone1' },
      { id: 'pedestrianzone2', name: 'Pedestrian Zone 2', category: 'pedestrianzone', routeNumber: 2, path: '/newtopo/routes/pedestrianzone2' }
    ]
  },

  // 4: Advanced Rules
  {
    id: 'centralreservation',
    name: 'Central Reservations',
    description: '',
    routes: [
      { id: 'centralreservation1', name: 'Central Reservation 1', category: 'centralreservation', routeNumber: 1, path: '/newtopo/routes/centralreservation1' },
      { id: 'centralreservation2', name: 'Central Reservation 2', category: 'centralreservation', routeNumber: 2, path: '/newtopo/routes/centralreservation2' },
      { id: 'centralreservation3', name: 'Central Reservation 3', category: 'centralreservation', routeNumber: 3, path: '/newtopo/routes/centralreservation3' },
      { id: 'centralreservation4', name: 'Central Reservation 4', category: 'centralreservation', routeNumber: 4, path: '/newtopo/routes/centralreservation4' },
      { id: 'centralreservation5', name: 'Central Reservation 5', category: 'centralreservation', routeNumber: 5, path: '/newtopo/routes/centralreservation5' }
    ]
  },
  {
    id: 'roadsontop',
    name: 'Roads On Top',
    description: '',
    routes: [
      { id: 'roadsontop1', name: 'Road on Top 1', category: 'roadsontop', routeNumber: 1, path: '/newtopo/routes/roadsontop1' },
      { id: 'roadsontop2', name: 'Road on Top 2', category: 'roadsontop', routeNumber: 2, path: '/newtopo/routes/roadsontop2' },
      { id: 'roadsontop3', name: 'Road on Top 3', category: 'roadsontop', routeNumber: 3, path: '/newtopo/routes/roadsontop3' },
      { id: 'roadsontop4', name: 'Road on Top 4', category: 'roadsontop', routeNumber: 4, path: '/newtopo/routes/roadsontop4' }
    ]
  },
  {
    id: 'flyoverroundabouts',
    name: 'Flyover Roundabouts',
    description: '',
    routes: [
      { id: 'flyoverroundabouts1', name: 'Flyover Roundabout 1', category: 'flyoverroundabouts', routeNumber: 1, path: '/newtopo/routes/flyoverroundabouts1' },
      { id: 'flyoverroundabouts2', name: 'Flyover Roundabout 2', category: 'flyoverroundabouts', routeNumber: 2, path: '/newtopo/routes/flyoverroundabouts2' },
      { id: 'flyoverroundabouts3', name: 'Flyover Roundabout 3', category: 'flyoverroundabouts', routeNumber: 3, path: '/newtopo/routes/flyoverroundabouts3' },
      { id: 'flyoverroundabouts4', name: 'Flyover Roundabout 4', category: 'flyoverroundabouts', routeNumber: 4, path: '/newtopo/routes/flyoverroundabouts4' }
    ]
  },
  {
    id: 'unmarkedoneways',
    name: 'Unmarked One-ways',
    description: '',
    routes: [
      { id: 'unmarkedoneways1', name: 'Unmarked One Way 1', category: 'unmarkedoneways', routeNumber: 1, path: '/newtopo/routes/unmarkedoneways1' },
      { id: 'unmarkedoneways2', name: 'Unmarked One Way 2', category: 'unmarkedoneways', routeNumber: 2, path: '/newtopo/routes/unmarkedoneways2' },
      { id: 'unmarkedoneways3', name: 'Unmarked One Way 3', category: 'unmarkedoneways', routeNumber: 3, path: '/newtopo/routes/unmarkedoneways3' }
    ]
  },

  // 5: General Routes
  {
    id: 'shortroutes',
    name: 'Short Routes',
    description: '',
    routes: [
      { id: 'shortroutes1', name: 'Short Route 1', category: 'shortroutes', routeNumber: 1, path: '/newtopo/routes/shortroutes1' },
      { id: 'shortroutes2', name: 'Short Route 2', category: 'shortroutes', routeNumber: 2, path: '/newtopo/routes/shortroutes2' },
      { id: 'shortroutes3', name: 'Short Route 3', category: 'shortroutes', routeNumber: 3, path: '/newtopo/routes/shortroutes3' },
      { id: 'shortroutes4', name: 'Short Route 4', category: 'shortroutes', routeNumber: 4, path: '/newtopo/routes/shortroutes4' },
      { id: 'shortroutes5', name: 'Short Route 5', category: 'shortroutes', routeNumber: 5, path: '/newtopo/routes/shortroutes5' },
      { id: 'shortroutes6', name: 'Short Route 6', category: 'shortroutes', routeNumber: 6, path: '/newtopo/routes/shortroutes6' },
      { id: 'shortroutes7', name: 'Short Route 7', category: 'shortroutes', routeNumber: 7, path: '/newtopo/routes/shortroutes7' },
      { id: 'shortroutes8', name: 'Short Route 8', category: 'shortroutes', routeNumber: 8, path: '/newtopo/routes/shortroutes8' },
      { id: 'shortroutes9', name: 'Short Route 9', category: 'shortroutes', routeNumber: 9, path: '/newtopo/routes/shortroutes9' }
    ]
  },
  {
    id: 'cityroutes',
    name: 'City Routes',
    description: '',
    routes: [
      { id: 'cityroutes1', name: 'City Route 1', category: 'cityroutes', routeNumber: 1, path: '/newtopo/routes/cityroutes1' },
      { id: 'cityroutes2', name: 'City Route 2', category: 'cityroutes', routeNumber: 2, path: '/newtopo/routes/cityroutes2' },
      { id: 'cityroutes3', name: 'City Route 3', category: 'cityroutes', routeNumber: 3, path: '/newtopo/routes/cityroutes3' }
    ]
  },
  {
    id: 'otherroutes',
    name: 'Other Routes',
    description: '',
    routes: [
      { id: 'otherroutes1', name: 'Other Route 1', category: 'otherroutes', routeNumber: 1, path: '/newtopo/routes/otherroutes1' },
      { id: 'otherroutes2', name: 'Other Route 2', category: 'otherroutes', routeNumber: 2, path: '/newtopo/routes/otherroutes2' },
      { id: 'otherroutes3', name: 'Other Route 3', category: 'otherroutes', routeNumber: 3, path: '/newtopo/routes/otherroutes3' },
      { id: 'otherroutes4', name: 'Other Route 4', category: 'otherroutes', routeNumber: 4, path: '/newtopo/routes/otherroutes4' }
    ]
  },

  // 6: Special Routes
  {
    id: 'tunnels',
    name: 'Tunnels',
    description: '',
    routes: [
      { id: 'tunnels1', name: 'Tunnel 1', category: 'tunnels', routeNumber: 1, path: '/newtopo/routes/tunnels1' },
      { id: 'tunnels2', name: 'Tunnel 2', category: 'tunnels', routeNumber: 2, path: '/newtopo/routes/tunnels2' },
      { id: 'tunnels3', name: 'Tunnel 3', category: 'tunnels', routeNumber: 3, path: '/newtopo/routes/tunnels3' },
      { id: 'tunnels4', name: 'Tunnel 4', category: 'tunnels', routeNumber: 4, path: '/newtopo/routes/tunnels4' },
      { id: 'tunnels5', name: 'Tunnel 5', category: 'tunnels', routeNumber: 5, path: '/newtopo/routes/tunnels5' },
      { id: 'tunnels6', name: 'Tunnel 6', category: 'tunnels', routeNumber: 6, path: '/newtopo/routes/tunnels6' }
    ]
  },
  {
    id: 'closedroads',
    name: 'Closed Roads',
    description: '',
    routes: [
      { id: 'closedroads1', name: 'Closed Road 1', category: 'closedroads', routeNumber: 1, path: '/newtopo/routes/closedroads1' },
      { id: 'closedroads2', name: 'Closed Road 2', category: 'closedroads', routeNumber: 2, path: '/newtopo/routes/closedroads2' },
      { id: 'closedroads3', name: 'Closed Road 3', category: 'closedroads', routeNumber: 3, path: '/newtopo/routes/closedroads3' },
      { id: 'closedroads4', name: 'Closed Road 4', category: 'closedroads', routeNumber: 4, path: '/newtopo/routes/closedroads4' },
      { id: 'closedroads5', name: 'Closed Road 5', category: 'closedroads', routeNumber: 5, path: '/newtopo/routes/closedroads5' }
    ]
  }
];

export function getAllRoutes(): Route[] {
  return ROUTE_CATEGORIES.flatMap(category => category.routes);
}

export function getRouteById(id: string): Route | undefined {
  return getAllRoutes().find(route => route.id === id);
}

export function getRoutesByCategory(categoryId: string): Route[] {
  const category = ROUTE_CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.routes : [];
}

export function getAvailableRoutesForUser(userRoutes: string[]): Route[] {
  return getAllRoutes().filter(route => userRoutes.includes(route.id));
}