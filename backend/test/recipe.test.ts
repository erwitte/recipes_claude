import { describe, test, expect, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { callerAs, resetDb } from "./helpers";

describe("recipe CRUD", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("creates a recipe with an ingredient and a step", async () => {
    const caller = callerAs("user_1");

    const recipe = await caller.recipe.create({
      title: "Roast Turkey",
      ingredients: [{ name: "salt", quantity: null, unit: null }],
      steps: [{ instruction: "Preheat oven" }],
    });

    expect(recipe.title).toBe("Roast Turkey");
    expect(recipe.ingredients).toHaveLength(1);
    expect(recipe.steps).toHaveLength(1);
  });

  test("accepts an ingredient with just a name, or name + quantity + unit", async () => {
    const caller = callerAs("user_1");

    const recipe = await caller.recipe.create({
      title: "Pancakes",
      ingredients: [
        { name: "salt" },
        { name: "flour", quantity: "200", unit: "g" },
      ],
      steps: [{ instruction: "Mix" }],
    });

    expect(recipe.ingredients[0]?.name).toBe("salt");
    expect(recipe.ingredients[0]?.quantity).toBeNull();
    expect(recipe.ingredients[1]).toMatchObject({ name: "flour", quantity: "200", unit: "g" });
  });

  test("stores and displays steps in entry order", async () => {
    const caller = callerAs("user_1");

    const recipe = await caller.recipe.create({
      title: "Pancakes",
      ingredients: [{ name: "flour" }],
      steps: [{ instruction: "Mix" }, { instruction: "Cook" }, { instruction: "Serve" }],
    });

    expect(recipe.steps.map((s) => s.instruction)).toEqual(["Mix", "Cook", "Serve"]);
  });

  test("servings and notes are optional", async () => {
    const caller = callerAs("user_1");

    const recipe = await caller.recipe.create({
      title: "Simple",
      ingredients: [{ name: "water" }],
      steps: [{ instruction: "Boil" }],
    });

    expect(recipe.servings).toBeNull();
    expect(recipe.notes).toBeNull();
  });

  test("edits a recipe's fields, including reordering ingredients and steps", async () => {
    const caller = callerAs("user_1");

    const created = await caller.recipe.create({
      title: "Original",
      ingredients: [{ name: "a" }, { name: "b" }],
      steps: [{ instruction: "first" }, { instruction: "second" }],
    });

    const updated = await caller.recipe.update({
      id: created.id,
      title: "Renamed",
      servings: 4,
      notes: "great",
      ingredients: [{ name: "b" }, { name: "a" }, { name: "c" }],
      steps: [{ instruction: "second" }, { instruction: "first" }],
    });

    expect(updated.title).toBe("Renamed");
    expect(updated.servings).toBe(4);
    expect(updated.notes).toBe("great");
    expect(updated.ingredients.map((i) => i.name)).toEqual(["b", "a", "c"]);
    expect(updated.steps.map((s) => s.instruction)).toEqual(["second", "first"]);
  });

  test("preserves a step's photo across an unrelated edit", async () => {
    const caller = callerAs("user_1");
    const workspace = await caller.workspace.get();
    const imageKey = `${workspace.id}/step-photo.jpg`;

    const created = await caller.recipe.create({
      title: "Original",
      ingredients: [{ name: "a" }],
      steps: [{ instruction: "first", imageKey }, { instruction: "second" }],
    });
    expect(created.steps[0]?.imageKey).toBe(imageKey);

    const updated = await caller.recipe.update({
      id: created.id,
      title: "Renamed",
      ingredients: [{ name: "a" }],
      steps: [{ instruction: "first", imageKey }, { instruction: "second" }],
    });

    expect(updated.steps[0]?.imageKey).toBe(imageKey);
  });

  test("rejects a cover image or step image key belonging to another workspace", async () => {
    const owner = callerAs("owner");
    const otherWorkspace = await callerAs("other").workspace.get();

    await expect(
      owner.recipe.create({
        title: "Hijack",
        coverImageKey: `${otherWorkspace.id}/stolen.jpg`,
        ingredients: [{ name: "a" }],
        steps: [{ instruction: "s" }],
      }),
    ).rejects.toThrow(TRPCError);

    await expect(
      owner.recipe.create({
        title: "Hijack",
        ingredients: [{ name: "a" }],
        steps: [{ instruction: "s", imageKey: `${otherWorkspace.id}/stolen.jpg` }],
      }),
    ).rejects.toThrow(TRPCError);
  });

  test("deletes a recipe", async () => {
    const caller = callerAs("user_1");

    const created = await caller.recipe.create({
      title: "To delete",
      ingredients: [{ name: "a" }],
      steps: [{ instruction: "step" }],
    });

    await caller.recipe.delete({ id: created.id });

    await expect(caller.recipe.get({ id: created.id })).rejects.toThrow();
  });

  test("browse-all view lists every recipe in the workspace", async () => {
    const caller = callerAs("user_1");

    await caller.recipe.create({ title: "One", ingredients: [{ name: "a" }], steps: [{ instruction: "s" }] });
    await caller.recipe.create({ title: "Two", ingredients: [{ name: "a" }], steps: [{ instruction: "s" }] });

    const list = await caller.recipe.list();
    expect(list.map((r) => r.title).sort()).toEqual(["One", "Two"]);
  });

  test("a user cannot view, edit, or delete another user's recipe", async () => {
    const ownerCaller = callerAs("owner");
    const otherCaller = callerAs("other");

    const recipe = await ownerCaller.recipe.create({
      title: "Owner's recipe",
      ingredients: [{ name: "a" }],
      steps: [{ instruction: "s" }],
    });

    await expect(otherCaller.recipe.get({ id: recipe.id })).rejects.toThrow(TRPCError);
    await expect(
      otherCaller.recipe.update({
        id: recipe.id,
        title: "Hijacked",
        ingredients: [{ name: "a" }],
        steps: [{ instruction: "s" }],
      }),
    ).rejects.toThrow(TRPCError);
    await expect(otherCaller.recipe.delete({ id: recipe.id })).rejects.toThrow(TRPCError);

    const ownerList = await otherCaller.recipe.list();
    expect(ownerList).toHaveLength(0);
  });
});
