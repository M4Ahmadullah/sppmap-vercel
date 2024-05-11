import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FrequentlyAsked = [
  {
    key: 1,
    question: "What are the Required System for the Map?",
    answer: `We recommend using the Google Chrome browser for the best experience. Please ensure that your screen size is a minimum of 12 inches. Additionally, having a separate mouse can enhance navigation. Your screen resolution should be at least 1280x950 pixels for optimal viewing. To minimize distractions, find a quiet environment where you can focus without interruptions. Make sure your computer settings allow for the acceptance of cookies and the execution of scripts. For smooth performance, a fast and reliable internet connection is essential. Keep in mind that public places like libraries or internet cafés may have restrictions on their computers, such as no script execution or cookie acceptance. Before starting, close all tabs in your browser except for the one needed for the exam trial(s).`,
  },
  {
    key: 2,
    question: "Is this map the Same map to the Assessment?",
    answer: "Definitly, The map we use is the Exact Same map!",
  },
  {
    key: 3,
    question: "Is it possible to Practice using the phone?",
    answer:
      "Definitly not, You're required to use a desktop computer or laptop for the practice sessions. While you can book your package using a mobile phone, it's important to note that the actual practice sessions must be conducted on a desktop computer or laptop. This mimics the conditions of the real exam with TfL.",
  },
];
const Testimonials = () => {
  return (
    <div
      className="w-full h-fit flex flex-col items-center justify-center"
      id="questions"
    >
      <div className="w-full h-fit p-10 lg:w-[70%] py-32">
        <h1 className="text-center text-3xl font-bold pb-10">
          Asked<span className="text-red-700"> Questions</span>
        </h1>
        {FrequentlyAsked.map((qs) => (
          <div key={qs.key}>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl">
                  {qs.question}
                </AccordionTrigger>
                <AccordionContent className="text-lg">
                  {qs.answer}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
