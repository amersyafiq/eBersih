import {
  AlphabetIcon,
  BuildingIcon,
  ContractorIcon,
  HomeIcon,
  LetterIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
  UserIcon,
  Widget4Icon,
  WindowIcon
} from "./icon";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Overview",
        url: "/overview",
        icon: <HomeIcon />,
        items: [],
      },   
      {
        title: "Live Monitor",
        url: "/live",
        icon: <TableIcon />,
        items: [],
      },
      {
        title: "Manage Facility",
        url: "/facility",
        icon: <BuildingIcon />,
        items: [],
      },
      {
        title: "Manage Contractor",
        url: "/contractor",
        icon: <ContractorIcon />,
        items: [],
      },
      {
        title: "Manage Task",
        url: "/task",
        icon: <TaskIcon />,
        items: [],
      },
      {
        title: "Reports",
        icon: <LetterIcon />,
        items: [
          {
            title: "Workload Distribution",
            url: "/reports/workload",
          },
          {
            title: "GA Performance",
            url: "/reports/ga-performance",
          },
          {
            title: "Contractor Performance",
            url: "/reports/contractor-performance",
          },
          {
            title: "Completion History",
            url: "/reports/history",
          },
        ],
      },
    ],
  },
  {
    label: "OTHERS",
    items: [
      {
        title: "Charts",
        icon: <PieChartIcon />,
        items: [
          {
            title: "Line Charts",
            url: "/charts/line-charts",
          },
          {
            title: "Bar Charts",
            url: "/charts/bar-charts",
          },
          {
            title: "Pie Charts",
            url: "/charts/pie-charts",
          },
        ],
      },
      {
        title: "UI Elements",
        icon: <Widget4Icon />,
        items: [
          {
            title: "Accordion",
            url: "/ui-elements/accordion",
          },
          {
            title: "Avatars",
            url: "/ui-elements/avatars",
          },
          {
            title: "Buttons",
            url: "/ui-elements/buttons",
          },
          {
            title: "Breadcrumbs",
            url: "/ui-elements/breadcrumbs",
          },
          {
            title: "Progress",
            url: "/ui-elements/progress",
          },
          {
            title: "Tooltips",
            url: "/ui-elements/tooltips",
          },
        ],
      },
    ],
  },
];
