<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_and_replace_product_image_deleting_old_file(): void
    {
        Storage::fake('public');
        $this->asAdmin();

        $category = $this->postJson('/api/admin/categories', [
            'name' => 'Signature',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $firstImage = UploadedFile::fake()->image('latte.jpg', 400, 400);

        $created = $this->post('/api/admin/products', [
            'code' => 'IMG-LATTE',
            'name' => 'Caramel Latte',
            'category_id' => $category['id'],
            'price' => '32000.00',
            'active' => '1',
            'image' => $firstImage,
        ], ['Origin' => 'http://localhost', 'Accept' => 'application/json'])
            ->assertCreated()
            ->json('data');

        $this->assertNotNull($created['image_url']);
        $this->assertStringStartsWith('/storage/products/', $created['image_url']);

        $firstStoredPath = Product::query()->findOrFail($created['id'])->image_path;
        Storage::disk('public')->assertExists($firstStoredPath);

        // GET /api/products returns image_url
        $this->getJson('/api/products', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.0.image_url', $created['image_url']);

        // Replace image using POST with _method=PATCH (browser FormData pattern)
        $secondImage = UploadedFile::fake()->image('latte-v2.png', 500, 500);

        $updated = $this->post('/api/admin/products/'.$created['id'], [
            '_method' => 'PATCH',
            'name' => 'Iced Caramel Latte',
            'image' => $secondImage,
        ], ['Origin' => 'http://localhost', 'Accept' => 'application/json'])
            ->assertOk()
            ->json('data');

        $secondStoredPath = Product::query()->findOrFail($created['id'])->image_path;
        $this->assertNotSame($firstStoredPath, $secondStoredPath);
        Storage::disk('public')->assertMissing($firstStoredPath);
        Storage::disk('public')->assertExists($secondStoredPath);
        $this->assertSame('/storage/'.$secondStoredPath, $updated['image_url']);
    }

    public function test_product_image_rejects_unsupported_file_types(): void
    {
        Storage::fake('public');
        $this->asAdmin();

        $category = $this->postJson('/api/admin/categories', [
            'name' => 'Signature',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $invalidFile = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $this->post('/api/admin/products', [
            'code' => 'BAD-IMG',
            'name' => 'Bad Image Product',
            'category_id' => $category['id'],
            'price' => '20000.00',
            'image' => $invalidFile,
        ], ['Origin' => 'http://localhost', 'Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    private function asAdmin(): User
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(Role::query()->where('code', 'admin')->firstOrFail());
        $this->actingAs($employee->fresh())->withSession(['active_role' => 'admin']);

        return $employee;
    }
}
