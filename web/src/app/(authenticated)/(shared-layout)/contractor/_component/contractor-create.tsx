"use client";

import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { Form } from "react-aria-components";
import { toast } from "react-toastify";

import { Button, buttonStyles } from "@/src/components/tailgrids/core/button";
import { Checkbox } from "@/src/components/tailgrids/core/checkbox";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/src/components/tailgrids/core/dialog";
import { InputGroup, InputGroupInput } from "@/src/components/tailgrids/core/input-group";
import { Label } from "@/src/components/tailgrids/core/label";
import { Backdrop, OverlayWrapper } from "@/src/components/tailgrids/core/overlay";
import { TextField } from "@/src/components/tailgrids/core/text-field";
import { cn } from "@/src/utils/cn";

import { createContractorSchema } from "@/src/services/api/contractor/types";
import { useCreateContractor } from "@/src/services/api/contractor";
import { useZones } from "@/src/services/api/live";
import { useCurrentUser } from "@/src/services/api/auth";
import { Spinner } from "@/src/components/tailgrids/core/spinner";

export default function ContractorCreate({
    openCreateDialog,
    setOpenCreateDialog,
}: {
    openCreateDialog: boolean;
    setOpenCreateDialog: Dispatch<SetStateAction<boolean>>;
}) {
    const [companyRegNo, setCompanyRegNo] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyPhone, setCompanyPhone] = useState("");
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const { data: user } = useCurrentUser();
    const campusCode = user?.campus?.CampusCode ?? null;

    const { data: availableZones } = useZones(campusCode);
    const { mutate, isPending, error, reset } = useCreateContractor();

    const resetForm = () => {
        setCompanyRegNo("");
        setCompanyName("");
        setCompanyPhone("");
        setSelectedZones([]);
        setFieldErrors({});
        reset();
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) resetForm();
        setOpenCreateDialog(isOpen);
    };

    const handleToggleZone = (zoneCode: string, checked: boolean) => {
        if (checked) {
            setSelectedZones((prev) => [...prev, zoneCode]);
        } else {
            setSelectedZones((prev) => prev.filter((c) => c !== zoneCode));
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFieldErrors({});

        const parsed = createContractorSchema.safeParse({
            companyRegNo,
            companyName,
            companyPhone,
            selectedZones: selectedZones,
        });

        if (!parsed.success) {
            setFieldErrors(parsed.error.flatten().fieldErrors);
            return;
        }

        mutate(parsed.data, {
            onSuccess: () => {
                toast.success("Contractor company created successfully!");
                handleOpenChange(false);
            },
            onError: (err) => {
                toast.error(err.message);
            },
        });
    };

    return (
        <OverlayWrapper isOpen={openCreateDialog} onOpenChange={handleOpenChange}>
            <Backdrop isDismissable>
                <Dialog className="max-w-125 p-0">
                    <Form onSubmit={handleSubmit}>
                        <DialogHeader className="gap-1 border-b border-card-border py-4 pr-14 pl-5">
                            <DialogTitle className="text-xl leading-7">
                                Add Contractor Company
                            </DialogTitle>
                            <DialogDescription className="text-text-tertiary">
                                Register a new cleaning contractor and assign their operational campus zones.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogBody className="space-y-4 px-5 py-4 max-h-[70vh] overflow-y-auto">
                            {/* Server Error Banner from TanStack Query */}
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                                    {error.message}
                                </div>
                            )}

                            <div className="flex grid-cols-1 sm:grid-cols-2 gap-2">
                                <TextField required className="sm:col-span-2">
                                    <Label className="mb-1.5 block text-xs font-medium text-text-secondary">
                                        Company Registration Number <span className="text-red-500">*</span>
                                    </Label>
                                    <InputGroup className="h-9">
                                        <InputGroupInput
                                            value={companyRegNo}
                                            onChange={(e) => setCompanyRegNo(e.target.value)}
                                            placeholder="e.g. CTR-01"
                                            className="text-sm"
                                        />
                                    </InputGroup>
                                    {fieldErrors.companyRegNo?.[0] && (
                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.companyRegNo[0]}</p>
                                    )}
                                </TextField>
                                <TextField required className="sm:col-span-2">
                                    <Label className="mb-1.5 block text-xs font-medium text-text-secondary">
                                        Company Phone <span className="text-red-500">*</span>
                                    </Label>
                                    <InputGroup className="h-9">
                                        <InputGroupInput
                                            value={companyPhone}
                                            onChange={(e) => setCompanyPhone(e.target.value)}
                                            placeholder="e.g. 03-56123344"
                                            className="text-sm"
                                        />
                                    </InputGroup>
                                    {fieldErrors.companyPhone?.[0] && (
                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.companyPhone[0]}</p>
                                    )}
                                </TextField>
                            </div>

                            <TextField required className="sm:col-span-1">
                                <Label className="mb-1.5 block text-xs font-medium text-text-secondary">
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <InputGroup className="h-9">
                                    <InputGroupInput
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. Bersih Maju Services Sdn. Bhd."
                                        className="text-sm"
                                    />
                                </InputGroup>
                                {fieldErrors.companyName?.[0] && (
                                    <p className="mt-1 text-xs text-red-500">{fieldErrors.name[0]}</p>
                                )}
                            </TextField>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <Label className="text-xs font-medium text-text-secondary">
                                        Assign Operational Zones <span className="text-red-500">*</span>
                                    </Label>
                                    <span className="text-xs text-text-tertiary">
                                        {selectedZones.length} selected
                                    </span>
                                </div>

                                <div className="max-h-44 overflow-y-auto rounded-lg border border-card-border divide-y divide-card-border">
                                    {availableZones && availableZones.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-text-tertiary">
                                            No unassigned zones available right now.
                                        </div>
                                    ) : (
                                        availableZones && availableZones.map((zone) => {
                                            const isChecked = selectedZones.includes(zone.ZoneCode);

                                            return (
                                                <div
                                                    key={zone.ZoneCode}
                                                    onClick={() => {
                                                        handleToggleZone(zone.ZoneCode, !isChecked);
                                                    }}
                                                    className="flex items-center justify-between px-3 py-2.5 text-sm transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Checkbox
                                                            isSelected={isChecked}
                                                            onChange={(checked) =>
                                                                handleToggleZone(zone.ZoneCode, checked)
                                                            }
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-text-primary text-xs">
                                                                {zone.ZoneName}
                                                            </span>
                                                            <span className="font-mono text-[11px] text-text-tertiary">
                                                                Code: {zone.ZoneCode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {fieldErrors.selectedZones?.[0] && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {fieldErrors.selectedZones[0]}
                                    </p>
                                )}
                            </div>
                        </DialogBody>

                        <DialogFooter className="border-t border-card-border px-5 py-4">
                            <DialogClose
                                isDisabled={isPending}
                                className={cn(
                                    buttonStyles({
                                        appearance: "outline",
                                        size: "lg",
                                        className: "px-3.5 text-sm",
                                    })
                                )}
                            >
                                Cancel
                            </DialogClose>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isPending}
                                className="px-3.5 text-sm min-w-35"
                            >
                                {isPending ? <Spinner /> : "Create Company"}
                            </Button>
                        </DialogFooter>
                    </Form>
                </Dialog>
            </Backdrop>
        </OverlayWrapper>
    );
}
