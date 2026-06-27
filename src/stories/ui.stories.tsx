import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const meta = {
  title: "Design System/UI",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ButtonStory: Story = {
  name: "Button",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Publicar</Button>
      <Button variant="secondary">Salvar rascunho</Button>
      <Button variant="outline">Pré-visualizar</Button>
      <Button variant="ghost">Cancelar</Button>
    </div>
  ),
};

export const InputStory: Story = {
  name: "Input",
  render: () => (
    <div className="w-[min(360px,80vw)] space-y-2">
      <Label htmlFor="church-name">Nome da igreja</Label>
      <Input id="church-name" placeholder="Igreja aamém" />
    </div>
  ),
};

export const TextareaStory: Story = {
  name: "Textarea",
  render: () => (
    <div className="w-[min(420px,80vw)] space-y-2">
      <Label htmlFor="church-about">Mensagem inicial</Label>
      <Textarea
        id="church-about"
        placeholder="Escreva uma mensagem curta para receber visitantes."
      />
    </div>
  ),
};

export const CardStory: Story = {
  name: "Card",
  render: () => (
    <Card className="w-[min(420px,80vw)]">
      <CardHeader>
        <CardTitle>Minisite da igreja</CardTitle>
        <CardDescription>
          Reúna horários, endereço, redes e pedidos de oração.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge>Pronto para editar</Badge>
      </CardContent>
      <CardFooter>
        <Button size="sm">Abrir editor</Button>
      </CardFooter>
    </Card>
  ),
};

export const BadgeStory: Story = {
  name: "Badge",
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge>Publicado</Badge>
      <Badge variant="secondary">Rascunho</Badge>
      <Badge variant="outline">Aguardando domínio</Badge>
    </div>
  ),
};

export const SeparatorStory: Story = {
  name: "Separator",
  render: () => (
    <div className="w-[min(420px,80vw)]">
      <p className="text-sm text-muted-foreground">Informações da igreja</p>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">Contato e redes sociais</p>
    </div>
  ),
};

export const TooltipStory: Story = {
  name: "Tooltip",
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Ver dica</Button>
      </TooltipTrigger>
      <TooltipContent>
        Use o Storybook para revisar componentes antes de montar telas.
      </TooltipContent>
    </Tooltip>
  ),
};
