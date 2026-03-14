import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={{ fontFamily: "'Wix Madefor Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-2xl group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:font-[inherit]",
          title: "font-semibold",
          description: "group-[.toast]:!text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-background group-[.toaster]:!border-border group-[.toaster]:!text-success",
          error: "group-[.toaster]:!bg-background group-[.toaster]:!border-border group-[.toaster]:!text-destructive",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
