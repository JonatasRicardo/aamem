import type { Preview } from '@storybook/nextjs-vite'
import { TooltipProvider } from '@/components/ui/tooltip'
import '../src/app/globals.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="min-h-screen bg-background p-8 text-foreground">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
