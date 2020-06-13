// Helper class for managing data bindings from DOM to JS
export class Binding {
    element: HTMLInputElement;
    data: string;
    handler: () => void;

    constructor(element: HTMLElement, data: string, handler: () => void) {
        console.log(element);
        this.element = element as HTMLInputElement;
        this.data = data;
        this.handler = handler;

        this.element.value = data;
        this.element.addEventListener("change", this, false);
    }

    handleEvent(event: Event): void {
        switch (event.type) {
            case "change":
                this.change(this.element.value);
        }
    }

    change(value: string): void {
        this.data = value;
        this.element.value = value;
        this.handler();
    }
}
