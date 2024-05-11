import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    step: 1,
    title: "Browser",
    description: "Preferably, utilize the Google Chrome browser.",
  },
  {
    step: 2,
    title: "Computer",
    description:
      "Use a laptop or desktop computer with a screen size of at least 12 inches.",
  },
  {
    step: 3,
    title: "Mouse",
    description: "For the Topographical Packages, a mouse is recommended.",
  },
  {
    step: 4,
    title: "Place",
    description: "Ensure a quiet environment free from interruptions.",
  },
  {
    step: 5,
    title: "Internet",
    description: "A stable internet connection is essential.",
  },
  {
    step: 6,
    title: "Resolution",
    description:
      "We suggest a screen resolution of 1280X950 for optimal viewing.",
  },
  {
    step: 7,
    title: "A-Z Topo",
    description:
      "For the (Full) Topographical Packages, it is advised to have the relevant edition of the Master Atlas London A-Z (Topo Packages only).",
  },
];

type CardProps = React.ComponentProps<typeof Card>;
export function CardDemo() {
  return (
    <Card className={cn("w-full h-full border-none")}>
      <div className="w-full h-full flex flex-col items-center justify-center md:flex-row md:flex-wrap">
        {steps.map((step, index) => (
          <div
            key={index}
            className="w-[80%] md:w-[400px] lg:w-[300px] md:pr-0 lg:pr-4 h-full flex items-center justify-center pb-5 lg:pb-10 lg:ml-10"
          >
            <div className="w-[80%] h-[320px] lg:w-[330px] lg:h-[380px] bg-red-800 mb-1 p-2 py-6 flex flex-col items-center justify-center  rounded-3xl border-2 border-black hover:bg-red-700 text-white">
              <CardHeader className=" bg-white rounded-full px-[60px] py-[50px] text-3xl font-semibold border-2 border-black hover:bg-gray-200 text-black">
                {step.step}
              </CardHeader>
              <CardTitle className="pt-5 text-2xl font-semibold pb-3">
                {step.title}
              </CardTitle>
              <CardContent className="text-center font-semibold">
                {step.description}
              </CardContent>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
